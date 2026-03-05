import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Admin() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add state
    const [newAuthor, setNewAuthor] = useState("");
    const [newQuote, setNewQuote] = useState("");
    const [adding, setAdding] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editAuthor, setEditAuthor] = useState("");
    const [editQuote, setEditQuote] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchTestimonials = async () => {
        try {
            const res = await fetch("/api/testimonials");
            const data = await res.json();
            setTestimonials(data.testimonials || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("确定要删除这条留言吗？")) return;
        try {
            const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
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
            const res = await fetch("/api/testimonials", {
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
            const res = await fetch(`/api/testimonials/${id}`, {
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

    return (
        <div className="min-h-screen bg-solarized-base3 text-solarized-base02 font-sans py-12 px-6 selection:bg-solarized-yellow selection:text-solarized-base3 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b-2 border-solarized-base02 pb-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">ClassFlow 留言管理</h1>
                        <p className="text-solarized-base01 mt-1 text-sm">简单直接的后端数据管理面板。</p>
                    </div>
                    <a href="/" className="btn-secondary">
                        返回主页
                    </a>
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
            </div>
        </div>
    );
}
