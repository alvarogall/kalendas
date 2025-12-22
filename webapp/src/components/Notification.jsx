const Notification = ({ color, message }) => {
  if (!message) return null;

  const bgColors = {
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    default: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  const styleClass = bgColors[color] || bgColors.default;

  return (
    <div className={`p-3 mb-2 rounded-lg border text-sm font-medium ${styleClass} animate-in fade-in slide-in-from-top-1`}>
      {message}
    </div>
  );
};

export default Notification;