import React, { useState, useCallback } from "react";
import { useFileSystem } from "../context/FileSystemContext";
import { FolderPlus, RefreshCw, FilePlus, Search, X } from "lucide-react";

interface ToolbarProps {
	currentPath: string;
}

export function Toolbar({ currentPath }: ToolbarProps) {
	const {
		createFolder,
		createFile,
		listFiles,
		searchFiles,
		isSearching,
		searchTerm: contextSearchTerm,
		clearSearch,
	} = useFileSystem();
	const [searchTerm, setSearchTerm] = useState(contextSearchTerm);

	const handleCreateFolder = () => {
		const name = prompt("Enter folder name:");
		if (name) {
			createFolder(currentPath, name);
		}
	};

	const handleCreateFile = () => {
		const name = prompt("Enter file name:");
		if (name) {
			createFile(currentPath, name, "");
		}
	};

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			searchFiles(searchTerm);
		},
		[searchFiles, searchTerm]
	);

	const handleClearSearch = () => {
		setSearchTerm("");
		clearSearch();
	};

	return (
		<div className="border-b bg-white p-2 flex items-center gap-2">
			<button
				onClick={handleCreateFolder}
				className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
			>
				<FolderPlus className="w-4 h-4" />
				New Folder
			</button>
			<button
				onClick={handleCreateFile}
				className="flex items-center gap-1 px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
			>
				<FilePlus className="w-4 h-4" />
				New File
			</button>
			<button
				onClick={() => listFiles(currentPath)}
				className="flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
			>
				<RefreshCw className="w-4 h-4" />
				Refresh
			</button>
			<form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
				<div className="relative">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search files..."
						className="px-3 py-1 pr-8 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					{searchTerm && (
						<button
							type="button"
							onClick={handleClearSearch}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>
				<button
					type="submit"
					className="flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
				>
					<Search className="w-4 h-4" />
					{isSearching ? "Searching..." : "Search"}
				</button>
			</form>
		</div>
	);
}
