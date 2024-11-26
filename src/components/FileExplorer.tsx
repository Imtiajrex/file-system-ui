import React, { useEffect } from "react";
import { useFileSystem } from "../context/FileSystemContext";
import { FileList } from "./FileList";
import { Toolbar } from "./Toolbar";
import { PathBreadcrumb } from "./PathBreadcrumb";

export function FileExplorer() {
	const { currentPath, setCurrentPath, listFiles } = useFileSystem();

	useEffect(() => {
		console.log("currentPath", currentPath);
		listFiles(currentPath);
	}, [currentPath, listFiles]);
	useEffect(() => {
		console.log("list file changing");
	}, [listFiles]);

	return (
		<div className="h-full flex flex-col">
			<Toolbar currentPath={currentPath} />
			<PathBreadcrumb path={currentPath} onNavigate={setCurrentPath} />
			<div className="flex-1 overflow-auto">
				<FileList currentPath={currentPath} onNavigate={setCurrentPath} />
			</div>
		</div>
	);
}
