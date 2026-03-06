import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const ADMIN_TOKEN_KEY = "classflow_admin_token";
const ADMIN_USERNAME = "admin";

const SITE_CONTENT_FIELDS = [
  { key: "hero_badge", label: "首页徽章" },
  { key: "hero_title_line1", label: "首页标题第一行" },
  { key: "hero_title_highlight", label: "首页标题高亮" },
  { key: "hero_description", label: "首页简介", multiline: true },
  { key: "feature_section_badge", label: "功能区徽章" },
  { key: "feature_section_title", label: "功能区标题" },
  { key: "feature_1_title", label: "功能 1 标题" },
  { key: "feature_1_desc", label: "功能 1 描述", multiline: true },
  { key: "feature_2_title", label: "功能 2 标题" },
  { key: "feature_2_desc", label: "功能 2 描述", multiline: true },
  { key: "feature_3_title", label: "功能 3 标题" },
  { key: "feature_3_desc", label: "功能 3 描述", multiline: true },
];

export default function Admin() {
    const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || "");
    const [loginUsername, setLoginUsername] = useState(ADMIN_USERNAME);
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);
    const [authUser, setAuthUser] = useState(null);

    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newAuthor, setNewAuthor] = useState("");
    const [newQuote, setNewQuote] = useState("");
    const [adding, setAdding] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editAuthor, setEditAuthor] = useState("");
    const [editQuote, setEditQuote] = useState("");
    const [saving, setSaving] = useState(false);

    const [siteContent, setSiteContent] = useState({});
    const [siteContentLoading, setSiteContentLoading] = useState(true);
    const [savingSiteKey, setSavingSiteKey] = useState("");
    const [downloadSettings, setDownloadSettings] = useState({
        preferSelfHosted: 1,
        selfHostedUrl: "",
        githubRepo: "shiro123444/ClassFlow",
        githubAssetName: "app-prod-arm64-v8a-release.apk",
        latestReleaseTag: "",
        latestGithubUrl: "",
        lastSyncStatus: "never",
        lastSyncError: "",
        lastSyncedAt: "",
    });
    const [effectiveDownloadUrl, setEffectiveDownloadUrl] = useState("");
    const [downloadSettingsLoading, setDownloadSettingsLoading] = useState(true);
    const [savingDownloadSettings, setSavingDownloadSettings] = useState(false);
    const [syncingDownloadSettings, setSyncingDownloadSettings] = useState(false);

    const authHeaders = useMemo(() => {
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
    }, [token]);

    const handleUnauthorized = () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken("");
        setAuthUser(null);
    };

    const authFetch = async (url, options = {}) => {
        const headers = {
            ...(options.headers || {}),
            ...authHeaders,
        };
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            handleUnauthorized();
            throw new Error("登录已过期，请重新登录");
        }
        return res;
    };

    const fetchMe = async () => {
        const res = await authFetch("/api/admin/me");
        const data = await res.json();
        setAuthUser(data.user || null);
    };

    const fetchTestimonials = async () => {
        try {
            const res = await authFetch("/api/admin/testimonials");
            const data = await res.json();
            setTestimonials(data.testimonials || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSiteContent = async () => {
        try {
            const res = await authFetch("/api/admin/site-content");
            const data = await res.json();
            const contentMap = (data.content || []).reduce((acc, row) => {
                acc[row.key] = row.value;
                return acc;
            }, {});
            setSiteContent(contentMap);
        } catch (err) {
            console.error(err);
        } finally {
            setSiteContentLoading(false);
        }
    };

    const fetchDownloadSettings = async () => {
        try {
            const res = await authFetch("/api/admin/download-settings");
            const data = await res.json();
            if (data?.settings) {
                setDownloadSettings(data.settings);
                setEffectiveDownloadUrl(data.effectiveDownloadUrl || "");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDownloadSettingsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setSiteContentLoading(false);
            return;
        }

        setLoading(true);
        setSiteContentLoading(true);
        setDownloadSettingsLoading(true);
        fetchMe();
        fetchTestimonials();
        fetchSiteContent();
        fetchDownloadSettings();
    }, [token]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginUsername.trim() || !loginPassword.trim()) return;

        setLoggingIn(true);
        setLoginError("");
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: loginUsername.trim(),
                    password: loginPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLoginError(data.error || "登录失败");
                return;
            }

            localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            setToken(data.token);
            setAuthUser(data.user || null);
            setLoginPassword("");
        } catch (err) {
            console.error(err);
            setLoginError("网络错误，请稍后重试");
        } finally {
            setLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authFetch("/api/admin/logout", { method: "POST" });
        } catch (err) {
            console.error(err);
        } finally {
            handleUnauthorized();
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("确定要删除这条留言吗？")) return;
        try {
            const res = await authFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTestimonials((prev) => prev.filter((t) => t.id !== id));
            } else {
                alert("删除失败");
            }
        } catch (err) {
            console.error(err);
            alert("网络错误");
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newAuthor.trim() || !newQuote.trim()) return;
        setAdding(true);
        try {
            const res = await authFetch("/api/admin/testimonials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author: newAuthor, quote: newQuote }),
            });
            const data = await res.json();
            if (res.ok) {
                setTestimonials((prev) => [data.testimonial, ...prev]);
                setNewAuthor("");
                setNewQuote("");
            } else {
                alert(data.error || "添加失败");
            }
        } catch (err) {
            console.error(err);
            alert("网络错误");
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (t) => {
        setEditingId(t.id);
        setEditAuthor(t.author);
        setEditQuote(t.quote);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditAuthor("");
        setEditQuote("");
    };

    const handleSaveEdit = async (id) => {
        if (!editAuthor.trim() || !editQuote.trim()) return;
        setSaving(true);
        try {
            const res = await authFetch(`/api/admin/testimonials/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author: editAuthor, quote: editQuote }),
            });
            const data = await res.json();
            if (res.ok) {
                setTestimonials((prev) =>
                    prev.map((t) => (t.id === id ? data.testimonial : t))
                );
                setEditingId(null);
            } else {
                alert(data.error || "更新失败");
            }
        } catch (err) {
            console.error(err);
            alert("网络错误");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSiteText = async (key) => {
        const value = (siteContent[key] || "").trim();
        if (!value) {
            alert("文案不能为空");
            return;
        }

        setSavingSiteKey(key);
        try {
            const res = await authFetch(`/api/admin/site-content/${encodeURIComponent(key)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "保存失败");
                return;
            }
            setSiteContent((prev) => ({ ...prev, [key]: value }));
        } catch (err) {
            console.error(err);
            alert("网络错误");
        } finally {
            setSavingSiteKey("");
        }
    };

    const handleSaveDownloadSettings = async () => {
        setSavingDownloadSettings(true);
        try {
            const payload = {
                preferSelfHosted: !!downloadSettings.preferSelfHosted,
                selfHostedUrl: downloadSettings.selfHostedUrl || "",
                githubRepo: downloadSettings.githubRepo || "",
                githubAssetName: downloadSettings.githubAssetName || "",
            };
            const res = await authFetch("/api/admin/download-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "保存失败");
                return;
            }

            setDownloadSettings(data.settings || payload);
            setEffectiveDownloadUrl(data.effectiveDownloadUrl || "");
            alert("下载配置已保存");
        } catch (err) {
            console.error(err);
            alert("网络错误");
        } finally {
            setSavingDownloadSettings(false);
        }
    };

    const handleSyncDownloadSettings = async () => {
        setSyncingDownloadSettings(true);
        try {
            const res = await authFetch("/api/admin/download-settings/sync", {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || data.lastSyncError || "同步失败");
                return;
            }

            await fetchDownloadSettings();
            alert("已完成同步");
        } catch (err) {
            console.error(err);
            alert("同步失败");
        } finally {
            setSyncingDownloadSettings(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-solarized-base3 text-solarized-base02 font-sans py-12 px-6 selection:bg-solarized-yellow selection:text-solarized-base3 pb-32">
                <div className="max-w-xl mx-auto space-y-8">
                    <div className="border-b-2 border-solarized-base02 pb-4">
                        <h1 className="text-3xl font-display font-bold">ClassFlow 管理员登录</h1>
                        <p className="text-solarized-base01 mt-1 text-sm">请输入管理员账号密码后进入控制台。</p>
                    </div>

                    <div className="bg-solarized-base2 border-2 border-solarized-base02 p-6 shadow-[8px_8px_0px_0px_rgba(0,43,54,1)]">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <label className="block">
                                <span className="block text-sm font-semibold mb-1">账号</span>
                                <input
                                    value={loginUsername}
                                    onChange={(e) => setLoginUsername(e.target.value)}
                                    className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                    required
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-semibold mb-1">密码</span>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                    required
                                />
                            </label>

                            {loginError && (
                                <p className="text-sm text-solarized-red font-semibold">{loginError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loggingIn}
                                className="btn-primary w-full"
                            >
                                {loggingIn ? "登录中..." : "进入后台"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-solarized-base3 text-solarized-base02 font-sans py-12 px-6 selection:bg-solarized-yellow selection:text-solarized-base3 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b-2 border-solarized-base02 pb-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">ClassFlow 留言管理</h1>
                        <p className="text-solarized-base01 mt-1 text-sm">简单直接的后端数据管理面板。</p>
                        {authUser && (
                            <p className="text-solarized-base01 mt-1 text-xs">当前管理员：{authUser.username}（{authUser.role}）</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <a href="/" className="btn-secondary">返回主页</a>
                        <button onClick={handleLogout} className="btn-secondary">退出登录</button>
                    </div>
                </div>

                {/* Add New Form */}
                <div className="bg-solarized-base2 border-2 border-solarized-base02 p-6 shadow-[8px_8px_0px_0px_rgba(0,43,54,1)]">
                    <h2 className="text-lg font-bold mb-4 font-display">新增留言数据</h2>
                    <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                        <label className="block flex-shrink-0 w-full md:w-1/4">
                            <span className="block text-sm font-semibold mb-1">昵称 (Max 12)</span>
                            <input
                                value={newAuthor}
                                onChange={(e) => setNewAuthor(e.target.value)}
                                maxLength={12}
                                placeholder="例如: 小明同学"
                                className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                required
                            />
                        </label>
                        <label className="block flex-grow w-full md:w-auto">
                            <span className="block text-sm font-semibold mb-1">内容 (Max 20)</span>
                            <input
                                value={newQuote}
                                onChange={(e) => setNewQuote(e.target.value)}
                                maxLength={20}
                                placeholder="例如: 这是一款能提升效率的工具"
                                className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                required
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={adding}
                            className="btn-primary whitespace-nowrap px-6 py-2 w-full md:w-auto mt-2 md:mt-0"
                        >
                            {adding ? "添加中..." : "新增记录"}
                        </button>
                    </form>
                </div>

                {loading ? (
                    <p className="text-solarized-base01">加载中...</p>
                ) : (
                    <div className="bg-solarized-base2 border-2 border-solarized-base02 shadow-[8px_8px_0px_0px_rgba(0,43,54,1)] overflow-hidden overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                            <thead className="bg-solarized-base02 text-solarized-base2">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider w-16">ID</th>
                                    <th className="px-6 py-4 font-bold tracking-wider w-48">昵称</th>
                                    <th className="px-6 py-4 font-bold tracking-wider auto">留言内容</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right w-48">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-solarized-base02">
                                {testimonials.map((t) => {
                                    const isEditing = editingId === t.id;
                                    return (
                                        <motion.tr
                                            key={t.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-solarized-base3/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-mono text-solarized-base01">{t.id}</td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        value={editAuthor}
                                                        onChange={(e) => setEditAuthor(e.target.value)}
                                                        maxLength={12}
                                                        className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-2 py-1 focus:outline-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="font-medium text-solarized-blue whitespace-normal block min-w-[120px]">{t.author}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        value={editQuote}
                                                        onChange={(e) => setEditQuote(e.target.value)}
                                                        maxLength={20}
                                                        className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-2 py-1 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="text-solarized-base01 whitespace-normal block min-w-[200px]">{t.quote}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveEdit(t.id)}
                                                            disabled={saving}
                                                            className="px-3 py-1.5 bg-solarized-cyan/10 text-solarized-cyan border-2 border-solarized-cyan font-bold hover:bg-solarized-cyan hover:text-solarized-base3 transition-colors cursor-pointer mr-2"
                                                        >
                                                            保存
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="px-3 py-1.5 bg-transparent text-solarized-base01 border-2 border-solarized-base01 font-bold hover:bg-solarized-base02 hover:text-solarized-base2 transition-colors cursor-pointer"
                                                        >
                                                            取消
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(t)}
                                                            className="px-3 py-1.5 bg-solarized-yellow/10 text-solarized-yellow border-2 border-solarized-yellow font-bold hover:bg-solarized-yellow hover:text-solarized-base3 transition-colors cursor-pointer mr-2"
                                                        >
                                                            编辑
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.id)}
                                                            className="px-3 py-1.5 bg-solarized-red/10 text-solarized-red border-2 border-solarized-red font-bold hover:bg-solarized-red hover:text-solarized-base3 transition-colors cursor-pointer"
                                                        >
                                                            删除
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                                {testimonials.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-solarized-base01">
                                            暂无留言数据
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="bg-solarized-base2 border-2 border-solarized-base02 p-6 shadow-[8px_8px_0px_0px_rgba(0,43,54,1)]">
                    <h2 className="text-lg font-bold mb-4 font-display">页面文案管理（持久化数据库）</h2>
                    {siteContentLoading ? (
                        <p className="text-solarized-base01">加载中...</p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {SITE_CONTENT_FIELDS.map((field) => (
                                <div key={field.key} className="border-2 border-solarized-base02 p-4 bg-solarized-base3">
                                    <p className="text-sm font-semibold mb-2">{field.label}</p>
                                    {field.multiline ? (
                                        <textarea
                                            value={siteContent[field.key] || ""}
                                            onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                            rows={3}
                                            className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                        />
                                    ) : (
                                        <input
                                            value={siteContent[field.key] || ""}
                                            onChange={(e) => setSiteContent((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                            className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                        />
                                    )}
                                    <button
                                        onClick={() => handleSaveSiteText(field.key)}
                                        disabled={savingSiteKey === field.key}
                                        className="mt-3 px-3 py-1.5 bg-solarized-cyan/10 text-solarized-cyan border-2 border-solarized-cyan font-bold hover:bg-solarized-cyan hover:text-solarized-base3 transition-colors cursor-pointer"
                                    >
                                        {savingSiteKey === field.key ? "保存中..." : "保存"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-solarized-base2 border-2 border-solarized-base02 p-6 shadow-[8px_8px_0px_0px_rgba(0,43,54,1)]">
                    <h2 className="text-lg font-bold mb-4 font-display">下载源管理（10分钟自动同步）</h2>
                    {downloadSettingsLoading ? (
                        <p className="text-solarized-base01">加载中...</p>
                    ) : (
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-semibold">
                                <input
                                    type="checkbox"
                                    checked={!!downloadSettings.preferSelfHosted}
                                    onChange={(e) =>
                                        setDownloadSettings((prev) => ({
                                            ...prev,
                                            preferSelfHosted: e.target.checked ? 1 : 0,
                                        }))
                                    }
                                />
                                优先使用自托管下载地址
                            </label>

                            <label className="block">
                                <span className="block text-sm font-semibold mb-1">自托管下载地址</span>
                                <input
                                    value={downloadSettings.selfHostedUrl || ""}
                                    onChange={(e) =>
                                        setDownloadSettings((prev) => ({
                                            ...prev,
                                            selfHostedUrl: e.target.value,
                                        }))
                                    }
                                    placeholder="https://your-domain/path/app.apk"
                                    className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                />
                            </label>

                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="block text-sm font-semibold mb-1">GitHub 仓库</span>
                                    <input
                                        value={downloadSettings.githubRepo || ""}
                                        onChange={(e) =>
                                            setDownloadSettings((prev) => ({
                                                ...prev,
                                                githubRepo: e.target.value,
                                            }))
                                        }
                                        placeholder="owner/repo"
                                        className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-sm font-semibold mb-1">Release 资源名</span>
                                    <input
                                        value={downloadSettings.githubAssetName || ""}
                                        onChange={(e) =>
                                            setDownloadSettings((prev) => ({
                                                ...prev,
                                                githubAssetName: e.target.value,
                                            }))
                                        }
                                        placeholder="app-prod-arm64-v8a-release.apk"
                                        className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-sm focus:outline-none focus:border-solarized-orange"
                                    />
                                </label>
                            </div>

                            <div className="text-xs text-solarized-base01 space-y-1">
                                <p>当前生效下载地址：{effectiveDownloadUrl || "(暂无)"}</p>
                                <p>最近同步标签：{downloadSettings.latestReleaseTag || "(暂无)"}</p>
                                <p>最近同步状态：{downloadSettings.lastSyncStatus || "never"}</p>
                                <p>最近同步时间：{downloadSettings.lastSyncedAt || "(暂无)"}</p>
                                {downloadSettings.lastSyncError && (
                                    <p className="text-solarized-red">最近错误：{downloadSettings.lastSyncError}</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleSaveDownloadSettings}
                                    disabled={savingDownloadSettings}
                                    className="px-3 py-1.5 bg-solarized-cyan/10 text-solarized-cyan border-2 border-solarized-cyan font-bold hover:bg-solarized-cyan hover:text-solarized-base3 transition-colors cursor-pointer"
                                >
                                    {savingDownloadSettings ? "保存中..." : "保存下载配置"}
                                </button>
                                <button
                                    onClick={handleSyncDownloadSettings}
                                    disabled={syncingDownloadSettings}
                                    className="px-3 py-1.5 bg-solarized-yellow/10 text-solarized-yellow border-2 border-solarized-yellow font-bold hover:bg-solarized-yellow hover:text-solarized-base3 transition-colors cursor-pointer"
                                >
                                    {syncingDownloadSettings ? "同步中..." : "立即同步 GitHub"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
