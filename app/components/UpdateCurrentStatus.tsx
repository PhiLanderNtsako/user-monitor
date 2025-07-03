"use client";

const statusColors: Record<string, string> = {
  Available: "bg-emerald-500 text-white",
  "On Lunch": "bg-amber-400 text-gray-800",
  "In a Meeting": "bg-blue-500 text-white",
  "On Leave": "bg-purple-500 text-white",
  "On Sick Leave": "bg-red-500 text-white",
  "Logged Out": "bg-gray-400 text-white",
  "On Call": "bg-indigo-600 text-white",
  "Away from Desk": "bg-yellow-300 text-black",
  Busy: "bg-orange-500 text-white",
  "On Break": "bg-cyan-400 text-gray-800",
  Default: "bg-gray-200 text-gray-800",
};

type StatusOption = {
	id: number;
	name: string;
};

type FormData = {
	note: string;
	start_time: string;
	end_time: string;
	status_id: number;
};


type UpdateCurrentStatusProps = {
  statuses: StatusOption[];
  onSubmit: (formData: FormData) => void;
}

export default function UpdateCurrentStatus({ statuses, onSubmit }: UpdateCurrentStatusProps) {

  return (
    			<section>
				<h2 className="text-xl font-semibold mb-4">
					Update Your Status
				</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {statuses.map((status) => (
        <button
          key={status.id}
          onClick={() =>
            onSubmit({
              status_id: status.id,
              note: "",
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600 * 1000).toISOString(),
            })
          }
          className={`hover:cursor-pointer px-4 py-4 rounded-full text-sm font-medium ${
            statusColors[status.name as keyof typeof statusColors] ||
            statusColors["Default"]
          }`}
        >
          {status.name}
        </button>
      ))}
      </div>
      	</section>
  );
}
