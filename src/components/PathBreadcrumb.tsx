import React from "react";
import { ChevronRight, Home } from "lucide-react";

interface PathBreadcrumbProps {
	path: string;
	onNavigate: (path: string) => void;
}

export function PathBreadcrumb({ path, onNavigate }: PathBreadcrumbProps) {
	const parts = path.split("/").filter(Boolean);

	return (
		<div className="flex items-center gap-1 px-4 py-2 bg-white border-b text-sm">
			<button
				onClick={() => onNavigate("/")}
				className="hover:text-blue-500 flex items-center"
			>
				<Home className="w-4 h-4" />
			</button>
			{parts.map((part, index) => {
				const currentPath = "/" + parts.slice(0, index + 1).join("/");
				return (
					<React.Fragment key={currentPath}>
						<ChevronRight className="w-4 h-4 text-gray-400" />
						<button
							onClick={() => onNavigate(currentPath)}
							className="hover:text-blue-500"
						>
							{part}
						</button>
					</React.Fragment>
				);
			})}
		</div>
	);
}
