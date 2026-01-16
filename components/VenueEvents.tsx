export default function VenueEvents() {
  const events = [
    {
      title: "Friday Night Fever",
      date: "This Friday",
      time: "8 PM - 2 AM",
      description: "Dance the night away with our resident DJ",
    },
    {
      title: "Weekend Special",
      date: "Saturday",
      time: "8 PM - 2 AM",
      description: "Premium cocktails and live music",
    },
    {
      title: "Midweek Madness",
      date: "Wednesday",
      time: "8 PM - 12 AM",
      description: "Happy hours and special discounts",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-purple-400 font-semibold">{event.date}</span>
            <span className="text-gray-400 text-sm">{event.time}</span>
          </div>
          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
          <p className="text-gray-400">{event.description}</p>
        </div>
      ))}
    </div>
  );
}

