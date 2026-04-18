import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Copy, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { db, Prompt } from './db';

const LOCAL_CATEGORIES_KEY = 'promothero:categories';

type ToastInfo = {
  kind: 'success' | 'error';
  title: string;
  message: string;
  actionLabel?: string;
  actionType?: 'undoPromptDelete' | 'undoCategoryDelete';
};

type DeletedCategorySnapshot = {
  name: string;
  previousCategories: string[];
  previousSelectedTags: string[];
  affectedPrompts: Array<{ id: number; tags: string[] }>;
};

function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  const [collapsed, setCollapsed] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<number | null>(null);
  const [deletedPromptSnapshot, setDeletedPromptSnapshot] = useState<Prompt | null>(null);
  const [deletedCategorySnapshot, setDeletedCategorySnapshot] = useState<DeletedCategorySnapshot | null>(null);

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : ['默认分类'];
    } catch {
      return ['默认分类'];
    }
  });

  const prompts = useLiveQuery(async () => db.prompts.orderBy('updatedAt').reverse().toArray(), []);

  const filteredPrompts = useMemo(() => {
    const all = prompts ?? [];
    const byCategory = categoryFilter === '全部'
      ? all
      : all.filter(p => (p.tags ?? []).includes(categoryFilter));
    if (!searchQuery.trim()) return byCategory;
    const query = searchQuery.toLowerCase();
    return byCategory.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query) ||
      (p.tags ?? []).some(tag => tag.toLowerCase().includes(query))
    );
  }, [prompts, categoryFilter, searchQuery]);

  const variableList = useMemo(() => {
    const vars = editContent.match(/\{\{(.*?)\}\}/g);
    if (!vars) return [];
    return [...new Set(vars.map(v => v.replace(/\{\{|\}\}/g, '').trim()).filter(Boolean))];
  }, [editContent]);

  const categoryCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const category of categories) map.set(category, 0);
    for (const prompt of prompts ?? []) {
      for (const tag of prompt.tags ?? []) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return map;
  }, [prompts, categories]);

  useEffect(() => {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (!selectedId) return;
    db.prompts.get(selectedId).then(prompt => {
      if (!prompt) return;
      setEditTitle(prompt.title);
      setEditContent(prompt.content);
      setSelectedTags(prompt.tags ?? []);
    });
  }, [selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && (event.key === 'P' || event.key === 'p')) {
        event.preventDefault();
        setCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (
    kind: ToastInfo['kind'],
    title: string,
    message: string,
    actionLabel?: string,
    actionType?: ToastInfo['actionType']
  ) => {
    setToast({ kind, title, message, actionLabel, actionType });
  };

  const handleUndo = async () => {
    if (!toast?.actionType) return;

    if (toast.actionType === 'undoPromptDelete' && deletedPromptSnapshot) {
      await db.prompts.put(deletedPromptSnapshot);
      setSelectedId(deletedPromptSnapshot.id ?? null);
      setEditTitle(deletedPromptSnapshot.title);
      setEditContent(deletedPromptSnapshot.content);
      setSelectedTags(deletedPromptSnapshot.tags ?? []);
      setDeletedPromptSnapshot(null);
      showToast('success', '已撤销', '提示词已恢复');
      return;
    }

    if (toast.actionType === 'undoCategoryDelete' && deletedCategorySnapshot) {
      setCategories(deletedCategorySnapshot.previousCategories);
      setSelectedTags(deletedCategorySnapshot.previousSelectedTags);

      for (const item of deletedCategorySnapshot.affectedPrompts) {
        await db.prompts.update(item.id, {
          tags: item.tags,
          updatedAt: new Date(),
        });
      }

      setDeletedCategorySnapshot(null);
      showToast('success', '已撤销', `分类「${deletedCategorySnapshot.name}」已恢复`);
    }
  };

  const handleCreatePrompt = () => {
    setSelectedId(null);
    setEditTitle('');
    setEditContent('');
    if (categoryFilter !== '全部') {
      setSelectedTags([categoryFilter]);
    } else {
      setSelectedTags([]);
    }
  };

  const handleSavePrompt = async () => {
    const data: Omit<Prompt, 'id'> = {
      title: editTitle.trim() || '未命名提示词',
      content: editContent,
      tags: selectedTags,
      updatedAt: new Date(),
    };

    try {
      if (selectedId) {
        await db.prompts.update(selectedId, data);
        showToast('success', '已保存', '提示词修改已保存');
        return;
      }

      const id = await db.prompts.add(data);
      setSelectedId(id);
      showToast('success', '已新增', '提示词已成功保存');
    } catch {
      showToast('error', '保存失败', '请重试或检查浏览器存储权限');
    }
  };

  const handleDeletePrompt = async () => {
    if (!selectedId) return;

    const target = await db.prompts.get(selectedId);
    if (!target) return;

    await db.prompts.delete(selectedId);
    setDeletedPromptSnapshot(target);
    showToast('success', '已删除', '提示词已删除', '撤销', 'undoPromptDelete');
    handleCreatePrompt();
  };

  const handleCopyPrompt = async () => {
    if (!editContent.trim()) return;
    try {
      await navigator.clipboard.writeText(editContent);
      showToast('success', '已复制', '提示词内容已复制，可直接粘贴使用');
    } catch {
      showToast('error', '复制失败', '请检查浏览器剪贴板权限');
    }
  };

  const handlePromptCardClick = async (item: Prompt) => {
    setSelectedId(item.id ?? null);
    setCopiedCardId(item.id ?? null);
    try {
      await navigator.clipboard.writeText(item.content ?? '');
      showToast('success', '已复制', `已复制：${item.title || '未命名提示词'}`);
    } catch {
      showToast('error', '复制失败', '请检查浏览器剪贴板权限');
    }

    window.setTimeout(() => setCopiedCardId(null), 500);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      setNewCategoryName('');
      return;
    }
    setCategories(prev => [...prev, name]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (name: string) => {
    const previousCategories = [...categories];
    const previousSelectedTags = [...selectedTags];
    setCategories(prev => prev.filter(item => item !== name));
    setSelectedTags(prev => prev.filter(tag => tag !== name));
    if (categoryFilter === name) setCategoryFilter('全部');

    const allPrompts = await db.prompts.toArray();
    const targets = allPrompts.filter(item => (item.tags ?? []).includes(name));

    const affectedPrompts: Array<{ id: number; tags: string[] }> = [];
    for (const prompt of targets) {
      if (!prompt.id) continue;
      affectedPrompts.push({ id: prompt.id, tags: [...(prompt.tags ?? [])] });
      await db.prompts.update(prompt.id, {
        tags: (prompt.tags ?? []).filter(tag => tag !== name),
        updatedAt: new Date(),
      });
    }

    setDeletedCategorySnapshot({
      name,
      previousCategories,
      previousSelectedTags,
      affectedPrompts,
    });

    showToast('success', '已删除分类', `分类「${name}」已删除`, '撤销', 'undoCategoryDelete');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]));
  };

  return (
    <div className="popup-root">
      {collapsed ? (
        <button className="launcher" onClick={() => setCollapsed(false)} title="展开 PromptManager">
          打开 PromptManager
        </button>
      ) : (
        <div className="panel-shell">
          {toast && (
            <div className={`toast toast-${toast.kind}`}>
              <div className="toast-icon">{toast.kind === 'success' ? '✓' : '!'}</div>
              <div className="toast-body">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-message">{toast.message}</div>
                {toast.actionLabel && (
                  <button className="toast-action" onClick={() => { void handleUndo(); }}>
                    {toast.actionLabel}
                  </button>
                )}
              </div>
            </div>
          )}

          <header className="panel-header">
            <div>
              <div className="app-title">PromptManager</div>
              <div className="app-subtitle">快速收集、分类和搜索你的常用提示词</div>
            </div>
            <button className="icon-btn ghost" onClick={() => setCollapsed(true)} title="隐藏面板 (Ctrl+Shift+P)">
              <X size={16} />
            </button>
          </header>

          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              placeholder="搜索标题、内容或标签..."
            />
          </div>

          <div className="layout-grid">
            <aside className="left-pane">
              <section className="category-panel">
                <div className="section-head">
                  <h3>分类</h3>
                </div>

                <div className="category-list">
                  <button
                    className={`category-row ${categoryFilter === '全部' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('全部')}
                  >
                    <span>全部</span>
                    <span className="badge">{prompts?.length ?? 0}</span>
                  </button>

                  {categories.map(category => (
                    <div key={category} className="category-row-wrap">
                      <button
                        className={`category-row ${categoryFilter === category ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(category)}
                      >
                        <span>{category}</span>
                        <span className="badge">{categoryCount.get(category) ?? 0}</span>
                      </button>
                      <button className="icon-btn danger tiny" onClick={() => handleDeleteCategory(category)} title="删除分类">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="inline-create">
                  <input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="新增分类"
                    className="mini-input"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                  />
                  <button className="icon-btn primary" onClick={handleAddCategory} title="添加分类">
                    <Plus size={14} />
                  </button>
                </div>
              </section>

              <section className="prompt-panel">
                <div className="section-head mt">
                  <h3>提示词</h3>
                  <button className="text-btn" onClick={handleCreatePrompt} title="新建提示词">
                    <Plus size={14} />
                    <span>新建</span>
                  </button>
                </div>
                <div className="helper-text">单击提示词卡片可直接复制并载入编辑器</div>

                <div className="prompt-list">
                  {filteredPrompts.map(item => (
                    <button
                      key={item.id}
                      className={`prompt-card ${item.id === selectedId ? 'active' : ''} ${item.id === copiedCardId ? 'copied' : ''}`}
                      onClick={() => {
                        void handlePromptCardClick(item);
                      }}
                    >
                      <div className="prompt-title">{item.title}</div>
                      <div className="prompt-preview">{item.content}</div>
                      {!!item.tags?.length && (
                        <div className="chip-row">
                          {item.tags.map(tag => (
                            <span key={tag} className="chip">{tag}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredPrompts.length === 0 && <div className="empty-state">没有匹配的提示词</div>}
                </div>
              </section>
            </aside>

            <main className="editor-pane">
              <div className="editor-toolbar">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="title-input"
                  placeholder="输入标题..."
                />
                <div className="actions">
                  <button className="icon-btn ghost" onClick={handleCopyPrompt} title="复制内容">
                    <Copy size={14} />
                  </button>
                  <button className="icon-btn danger" onClick={handleDeletePrompt} title="删除提示词">
                    <Trash2 size={14} />
                  </button>
                  <button className="text-btn primary" onClick={handleSavePrompt} title="保存提示词">
                    <Save size={14} />
                    <span>保存</span>
                  </button>
                </div>
              </div>

              <div className="tag-box">
                {categories.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {variableList.length > 0 && (
                <div className="vars-bar">
                  {variableList.map(variable => (
                    <span key={variable} className="var-pill">{`{{${variable}}}`}</span>
                  ))}
                </div>
              )}

              <textarea
                className="editor-area"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="输入提示词内容，使用 {{变量}} 定义变量..."
              />

              <button className="primary-save-bar" onClick={handleSavePrompt}>
                <Save size={16} />
                <span>{selectedId ? '保存修改' : '保存提示词'}</span>
              </button>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;