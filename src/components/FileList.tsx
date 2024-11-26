import React, { useState } from "react";
import { useFileSystem } from "../context/FileSystemContext";
import { formatDistanceToNow } from "date-fns";
import { File, Folder } from "lucide-react";
import { FileEditor } from "./FileEditor";

interface FileListProps {
	currentPath: string;
	onNavigate: (path: string) => void;
}

export function FileList({ currentPath, onNavigate }: FileListProps) {
	const { files, deleteItem, renameItem, isSearching, searchTerm } =
		useFileSystem();
	const [editingFile, setEditingFile] = useState<string | null>(null);

	const handleDoubleClick = (file: any) => {
		if (file.isDirectory) {
			onNavigate(file.path);
		} else {
			setEditingFile(file.path);
		}
	};

	const formatFileSize = (bytes: number) => {
		const units = ["B", "KB", "MB", "GB"];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(1)} ${units[unitIndex]}`;
	};

	return (
		<div className="p-4">
			{isSearching && (
				<div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
					<p className="text-blue-700">
						Showing search results for: <strong>{searchTerm}</strong>
					</p>
				</div>
			)}
			<table className="w-full">
				<thead>
					<tr className="text-left text-gray-600 border-b">
						<th className="pb-2">Name</th>
						<th className="pb-2">Size</th>
						<th className="pb-2">Modified</th>
						<th className="pb-2">Actions</th>
					</tr>
				</thead>
				<tbody>
					{files.length === 0 ? (
						<tr>
							<td colSpan={4} className="py-4 text-center text-gray-500">
								{isSearching
									? "No files found matching your search."
									: "This folder is empty."}
							</td>
						</tr>
					) : (
						files.map((file) => (
							<tr
								key={file.path}
								className="border-b hover:bg-gray-50 cursor-pointer"
								onDoubleClick={() => handleDoubleClick(file)}
							>
								<td className="py-2 flex items-center gap-2">
									{file.isDirectory ? (
										<Folder className="w-5 h-5 text-blue-500" />
									) : (
										<File className="w-5 h-5 text-gray-500" />
									)}
									{file.name}
								</td>
								<td className="py-2">
									{file.isDirectory ? "--" : formatFileSize(file.size)}
								</td>
								<td className="py-2">
									{formatDistanceToNow(new Date(file.modified), {
										addSuffix: true,
									})}
								</td>
								<td className="py-2">
									<button
										onClick={() => deleteItem(file.path)}
										className="text-red-600 hover:text-red-800 mr-2"
									>
										Delete
									</button>
									<button
										onClick={() => {
											const newName = prompt("Enter new name:", file.name);
											if (newName) renameItem(file.path, newName);
										}}
										className="text-blue-600 hover:text-blue-800 mr-2"
									>
										Rename
									</button>
									{!file.isDirectory && (
										<button
											onClick={() => setEditingFile(file.path)}
											className="text-green-600 hover:text-green-800"
										>
											Edit
										</button>
									)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
			{editingFile && (
				<FileEditor path={editingFile} onClose={() => setEditingFile(null)} />
			)}
		</div>
	);
}
