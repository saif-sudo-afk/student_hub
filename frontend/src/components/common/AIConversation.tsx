import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eraser, SendHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { clearAIHistory, getAIHistory, sendAIMessage } from '@/api/ai';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import type { AIMessage } from '@/types';

interface AIConversationProps {
  title: string;
  description: string;
  chips: Array<{ label: string; prompt: string }>;
}

function extractReferences(text: string) {
  const matches = text.match(/https?:\/\/(?!student-hub)[^\s]+/gi) ?? [];
  return matches.map((url) => {
    const cleanUrl = url.replace(/[).,\]]+$/, '');
    return { title: cleanUrl, url: cleanUrl };
  });
}

export function AIConversation({ title, description, chips }: AIConversationProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);

  const historyQuery = useQuery({
    queryKey: ['ai-history'],
    queryFn: getAIHistory,
  });

  useEffect(() => {
    if (historyQuery.data?.messages) {
      setMessages(historyQuery.data.messages);
    }
  }, [historyQuery.data]);

  const sendMutation = useMutation({
    mutationFn: sendAIMessage,
    onSuccess: (payload) => {
      setMessages((current) => [
        ...current,
        {
          id: `${payload.conversation_id}-assistant-${Date.now()}`,
          role: 'assistant',
          content: payload.reply,
          references: extractReferences(payload.reply),
          created_at: new Date().toISOString(),
        },
      ]);
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearAIHistory,
    onSuccess: () => {
      setMessages([]);
    },
  });

  const isBusy = sendMutation.isPending || clearMutation.isPending;
  const orderedMessages = useMemo(() => messages, [messages]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    const optimisticMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      references: [],
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticMessage]);
    setInput('');
    sendMutation.mutate(trimmed);
  }

  function resizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }

  if (historyQuery.isLoading) {
    return (
      <div className="section-shell flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading conversation..." />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="space-y-6">
        <div className="section-shell">
          <h3>{title}</h3>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        </div>
        <div className="section-shell">
          <h4 className="text-sm font-semibold uppercase tracking-[0.05em] text-text-secondary">Quick prompts</h4>
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:border-primary-light hover:text-primary-light"
                onClick={() => setInput(chip.prompt)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="section-shell flex min-h-[70vh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3>{title}</h3>
            <p className="mt-1 text-sm text-text-secondary">Conversation history is included on every request.</p>
          </div>
          <button
            type="button"
            className="btn-secondary gap-2 px-4"
            onClick={() => clearMutation.mutate()}
            disabled={isBusy}
          >
            <Eraser className="h-4 w-4" />
            Clear History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          {orderedMessages.length === 0 ? (
            <EmptyState
              title="Start the conversation"
              description="Ask for help with coursework, assignments, teaching tasks, or platform navigation."
            />
          ) : (
            <div className="space-y-4">
              {orderedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-card border px-4 py-3 ${
                      message.role === 'user'
                        ? 'border-primary-light bg-primary-light text-white'
                        : 'border-border bg-white text-text-primary'
                    }`}
                  >
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.05em] opacity-70">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="prose prose-sm max-w-none prose-p:my-0 prose-headings:my-2 prose-strong:text-inherit prose-a:text-primary-light">
                      {message.role === 'assistant' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.references.length > 0 ? (
                      <div className="mt-4 rounded-lg bg-surface p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.05em] text-text-secondary">
                          Further reading
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          {message.references.map((reference) => (
                            <a
                              key={`${message.id}-${reference.url}`}
                              href={reference.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-primary-light"
                            >
                              {reference.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {sendMutation.isPending ? (
                <div className="flex justify-start">
                  <div className="rounded-card border border-border bg-white px-4 py-3">
                    <Spinner label="Thinking..." />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-border bg-white pt-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={`footer-${chip.label}`}
                type="button"
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-primary-light"
                onClick={() => setInput(chip.prompt)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onInput={(event) => resizeTextarea(event.currentTarget)}
              className="form-textarea flex-1 resize-none"
              placeholder="Write your message..."
            />
            <button type="button" className="btn-primary gap-2" onClick={handleSubmit} disabled={isBusy}>
              <SendHorizontal className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
