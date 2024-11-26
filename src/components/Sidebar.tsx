// import React from "react";
// import {
// 	Home,
// 	HardDrive,
// 	Download,
// 	Image,
// 	FileText,
// 	Music,
// 	Video,
// } from "lucide-react";

export function Sidebar() {
	// const quickAccess = [];

	return (
		<div className="w-56 bg-white border-r flex flex-col">
			<div className="p-4 border-b">
				<h2 className="text-lg font-semibold">File Explorer</h2>
			</div>
			<div className="flex-1 overflow-auto">
				{/* <div className="p-2">
					<h3 className="text-sm font-medium text-gray-500 px-2 mb-2">
						Quick Access
					</h3>
					{quickAccess.map((item) => (
						<button
							key={item.label}
							className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 text-sm"
						>
							<item.icon className="w-4 h-4" />
							{item.label}
						</button>
					))}
				</div>
				<div className="p-2 border-t">
					<h3 className="text-sm font-medium text-gray-500 px-2 mb-2">
						Devices
					</h3>
					<button className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 text-sm">
						<HardDrive className="w-4 h-4" />
						Local Disk (C:)
					</button>
				</div> */}
			</div>
		</div>
	);
}
