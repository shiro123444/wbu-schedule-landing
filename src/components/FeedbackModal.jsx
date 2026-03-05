import { AnimatePresence, motion } from "framer-motion";

export default function FeedbackModal({
  isOpen,
  nickname,
  message,
  maxNicknameLength,
  maxMessageLength,
  moderationEnabled,
  submitPending,
  submitError,
  onNicknameChange,
  onMessageChange,
  onClose,
  onSubmit,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[95] bg-solarized-base3/90 backdrop-blur-[2px] px-4 py-8"
          onClick={onClose}
        >
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(7,54,66,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(7,54,66,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />

          <div className="h-full w-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl border-2 border-solarized-base02 bg-solarized-base3 shadow-[10px_10px_0_0_rgba(0,43,54,1)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b-2 border-solarized-base01/40 px-6 py-5">
                <p className="text-xs uppercase tracking-[0.18em] text-solarized-base01">
                  Leave a Message
                </p>
                <h3 className="mt-1 text-2xl font-display font-bold text-solarized-base02">
                  留下一句你的评价～
                </h3>
                <p className="mt-2 text-sm text-solarized-base01">
                 欢迎任何建议和需要改进的功能。
                </p>
                {moderationEnabled && (
                  <p className="mt-1 text-xs text-solarized-base01">
                    请注意文明哦。
                  </p>
                )}
              </div>

              <form onSubmit={onSubmit} className="px-6 py-6 space-y-5">
                <label className="block">
                  <span className="block text-sm font-semibold text-solarized-base02 mb-2">
                    昵称
                  </span>
                  <input
                    value={nickname}
                    onChange={onNicknameChange}
                    maxLength={maxNicknameLength}
                    placeholder="例如：小太阳"
                    className="w-full border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-solarized-base02 focus:outline-none focus:border-solarized-orange"
                    required
                  />
                  <span className="mt-1 block text-xs text-solarized-base01">
                    {nickname.length}/{maxNicknameLength}
                  </span>
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-solarized-base02 mb-2">
                    想说的话
                  </span>
                  <textarea
                    value={message}
                    onChange={onMessageChange}
                    maxLength={maxMessageLength}
                    placeholder="输入你的体验感受"
                    rows={3}
                    className="w-full resize-none border-2 border-solarized-base02 bg-solarized-base3 px-3 py-2 text-solarized-base02 focus:outline-none focus:border-solarized-orange"
                    required
                  />
                  <span className="mt-1 block text-xs text-solarized-base01">
                    {message.length}/{maxMessageLength}
                  </span>
                </label>

                {submitError && (
                  <p className="text-sm font-medium text-solarized-red">
                    {submitError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    className="btn-secondary cursor-pointer"
                    onClick={onClose}
                    disabled={submitPending}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="btn-primary cursor-pointer"
                    disabled={submitPending}
                  >
                    {submitPending ? "提交中..." : "提交留言"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
