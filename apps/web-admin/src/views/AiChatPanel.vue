<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <div class="chat-header__icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="chat-header__title">AI 灵感创作</div>
      <div class="chat-header__desc">输入灵感、链接或想法，AI 帮你生成母稿</div>
    </div>

    <div class="chat-messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="chat-empty">
        <div class="chat-empty__icon">
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="24" cy="24" r="20"/>
            <path d="M16 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
            <path d="M18 28c0 3.3 2.7 6 6 6s6-2.7 6-6"/>
            <line x1="24" y1="16" x2="24" y2="32"/>
          </svg>
        </div>
        <div class="chat-empty__title">有什么创作灵感？</div>
        <div class="chat-empty__desc">告诉我你的想法，我来帮你生成文章</div>
        <div class="chat-suggestions">
          <button v-for="s in suggestions" :key="s" @click="useSuggestion(s)">
            {{ s }}
          </button>
        </div>
      </div>

      <div v-else class="chat-message-list">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['chat-message', msg.role === 'user' ? 'chat-message--user' : 'chat-message--ai']"
        >
          <div class="chat-message__avatar">
            {{ msg.role === 'user' ? '我' : 'AI' }}
          </div>
          <div class="chat-message__bubble">
            <div class="chat-message__text" v-html="formatMessage(msg.content)"></div>
            <div v-if="msg.role === 'ai' && msg.generatedArticle" class="chat-message__actions">
              <n-button size="small" type="primary" @click="saveAsDraft(msg.generatedArticle)">
                保存为母稿
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="chat-message chat-message--ai">
        <div class="chat-message__avatar">AI</div>
        <div class="chat-message__bubble">
          <div class="chat-message__loading">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <n-input
        v-model:value="inputText"
        type="textarea"
        :rows="2"
        :autosize="{ minRows: 2, maxRows: 6 }"
        placeholder="输入你的灵感、想法或链接... 按 Enter 发送，Shift+Enter 换行"
        @keydown="handleKeydown"
      />
      <div class="chat-input__actions">
        <n-button
          type="primary"
          :loading="loading"
          :disabled="!inputText.trim()"
          @click="sendMessage"
        >
          发送
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { generateArticle, aiChat, importMarkdown } from "../api/services";
import { useRouter } from "vue-router";

const message = useMessage();
const dialog = useDialog();
const router = useRouter();

const inputText = ref("");
const loading = ref(false);
const messagesRef = ref<HTMLElement | null>(null);

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  generatedArticle?: { title: string; summary: string; markdownBody: string };
}

const messages = ref<ChatMessage[]>([]);

const suggestions = [
  "写一篇关于 AI 如何改变内容创作的文章",
  "分享微信公众号排版的最佳实践",
  "分析 2026 年内容运营的趋势",
  "写一篇关于远程办公效率的指南",
];

function useSuggestion(text: string) {
  inputText.value = text;
  void sendMessage();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    void sendMessage();
  }
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: "user", content: text });
  inputText.value = "";
  loading.value = true;

  await nextTick();
  scrollToBottom();

  try {
    const history = messages.value
      .filter((m) => !m.generatedArticle)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    const result = await aiChat(text, JSON.stringify(history));

    const isArticleRequest = /生成|文章|写|母稿|draft/i.test(text);

    if (isArticleRequest && messages.value.filter((m) => m.role === "user").length >= 1) {
      const article = await generateArticle(text);
      messages.value.push({
        role: "ai",
        content: `已为你生成文章《${article.title}》，点击"保存为母稿"即可保存到内容库。`,
        generatedArticle: article,
      });
    } else {
      messages.value.push({
        role: "ai",
        content: result.reply,
      });
    }
  } catch (err: any) {
    messages.value.push({
      role: "ai",
      content: `抱歉，AI 服务暂时不可用：${err.message || "请检查配置"}`,
    });
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

async function saveAsDraft(article: { title: string; summary: string; markdownBody: string }) {
  try {
    const result = await importMarkdown({
      title: article.title,
      summary: article.summary,
      markdownBody: article.markdownBody,
    });
    message.success("母稿已保存！");
    await router.push({
      path: "/content",
      query: { contentId: result.contentId, versionId: result.versionId },
    });
  } catch (err: any) {
    message.error("保存失败：" + (err.message || "未知错误"));
  }
}

function formatMessage(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e6ebf1;
  box-shadow: 0 2px 12px rgba(17, 24, 39, 0.04);
  overflow: hidden;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e6ebf1;
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
  color: #ffffff;
  flex-shrink: 0;
}

.chat-header__icon {
  margin-bottom: 6px;
  opacity: 0.9;
}

.chat-header__title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.chat-header__desc {
  font-size: 12px;
  opacity: 0.85;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafbfc;
}

.chat-empty {
  text-align: center;
  padding: 40px 20px;
}

.chat-empty__icon {
  margin-bottom: 16px;
  color: #c0c4cc;
}

.chat-empty__title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.chat-empty__desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 24px;
}

.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.chat-suggestions button {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  background: #ffffff;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-suggestions button:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.chat-message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-message {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.chat-message--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-message--ai {
  align-self: flex-start;
}

.chat-message__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.chat-message--user .chat-message__avatar {
  background: #409eff;
  color: #ffffff;
}

.chat-message--ai .chat-message__avatar {
  background: #ecf5ff;
  color: #409eff;
}

.chat-message__bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.chat-message--user .chat-message__bubble {
  background: #409eff;
  color: #ffffff;
  border-top-right-radius: 4px;
}

.chat-message--ai .chat-message__bubble {
  background: #ffffff;
  color: #303133;
  border: 1px solid #ebeef5;
  border-top-left-radius: 4px;
}

.chat-message__text {
  word-break: break-word;
}

.chat-message__text :deep(code) {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.chat-message__actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.chat-message__loading {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c0c4cc;
  animation: pulse 1.4s infinite ease-in-out;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #e6ebf1;
  background: #ffffff;
  flex-shrink: 0;
}

.chat-input__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
