import React, { useState, useEffect, useRef } from "react";
import { useFileSystem } from "../context/FileSystemContext";
import { X } from "lucide-react";

interface FileEditorProps {
	path: string;
	onClose: () => void;
}

export function FileEditor({ path, onClose }: FileEditorProps) {
	const { readFile, saveFile } = useFileSystem();
	const [content, setContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const loadContent = async () => {
			try {
				const fileContent = await readFile(path);
				setContent(fileContent);
			} catch (error) {
				console.error("Error loading file:", error);
			}
		};
		loadContent();
	}, [path, readFile]);

	const handleSave = async () => {
		try {
			setIsSaving(true);
			await saveFile(path, content);
		} catch (error) {
			console.error("Error saving file:", error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg w-3/4 h-3/4 flex flex-col">
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold">Editing: {path}</h2>
					<button onClick={onClose} className="hover:text-gray-700">
						<X className="w-5 h-5" />
					</button>
				</div>
				<div className="flex-1 p-4">
					<textarea
						ref={textareaRef}
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className="w-full h-full p-2 border rounded resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
						spellCheck="false"
					/>
				</div>
				<div className="p-4 border-t flex justify-end gap-2">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving}
						className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
					>
						{isSaving ? "Saving..." : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
