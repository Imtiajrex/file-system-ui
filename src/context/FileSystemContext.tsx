import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

interface FileSystemContextType {
	files: any[];
	currentPath: string;
	setCurrentPath: (path: string) => void;
	listFiles: (path: string) => void;
	createFolder: (path: string, name: string) => void;
	createFile: (path: string, name: string, content: string) => void;
	deleteItem: (path: string) => void;
	renameItem: (path: string, newName: string) => void;
	readFile: (path: string) => Promise<string>;
	saveFile: (path: string, content: string) => Promise<void>;
	searchFiles: (term: string) => void;
	isSearching: boolean;
	searchTerm: string;
	clearSearch: () => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(
	undefined
);

export function FileSystemProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [ws, setWs] = useState<WebSocket | null>(null);
	const [files, setFiles] = useState<any[]>([]);
	const [currentPath, setCurrentPath] = useState("/");
	const [isSearching, setIsSearching] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [messageHandlers] = useState(new Map());

	useEffect(() => {
		if (!ws) return;
		const socket = ws!;

		socket.onmessage = (event) => {
			const message = JSON.parse(event.data);

			if (message.type === "FILE_CONTENT" || message.type === "FILE_SAVED") {
				const handler = messageHandlers.get(message.type + message.path);
				if (handler) {
					handler(message);
					if (message.type === "FILE_CONTENT") {
						messageHandlers.delete(message.type + message.path);
					}
					return;
				}
			}

			switch (message.type) {
				case "FILES_LIST":
					console.log("files", message.data);
					setFiles(message.data);
					break;
				case "ERROR":
					console.error("Server error:", message.message);
					alert(message.message);
					setIsSearching(false);
					break;
				case "FOLDER_CREATED":
				case "FILE_CREATED":
				case "ITEM_DELETED":
				case "ITEM_RENAMED":
					if (!isSearching) {
						socket.send(
							JSON.stringify({ type: "LIST_FILES", path: currentPath })
						);
					}
					break;
			}
		};
	}, [ws, currentPath, messageHandlers, isSearching]);
	useEffect(() => {
		const socket = new WebSocket(`ws://${window.location.host}/ws`);

		socket.onopen = () => {
			console.log("Connected to WebSocket server");
			setWs(socket);
			socket.send(JSON.stringify({ type: "LIST_FILES", path: "/" }));
		};
		return () => {
			socket.close();
		};
	}, []);

	const listFiles = useCallback(
		(path: string) => {
			setIsSearching(false);
			setSearchTerm("");
			ws?.send(JSON.stringify({ type: "LIST_FILES", path }));
		},
		[ws]
	);

	const createFolder = useCallback(
		(path: string, name: string) => {
			ws?.send(JSON.stringify({ type: "CREATE_FOLDER", path, name }));
		},
		[ws]
	);

	const createFile = useCallback(
		(path: string, name: string, content: string) => {
			ws?.send(JSON.stringify({ type: "CREATE_FILE", path, name, content }));
		},
		[ws]
	);

	const deleteItem = useCallback(
		(path: string) => {
			if (confirm("Are you sure you want to delete this item?")) {
				ws?.send(JSON.stringify({ type: "DELETE", path }));
			}
		},
		[ws]
	);

	const renameItem = useCallback(
		(path: string, newName: string) => {
			ws?.send(JSON.stringify({ type: "RENAME", path, name: newName }));
		},
		[ws]
	);

	const readFile = useCallback(
		(path: string): Promise<string> => {
			return new Promise((resolve, reject) => {
				const handler = (message: any) => {
					if (message.type === "FILE_CONTENT") {
						resolve(message.content);
					} else if (message.type === "ERROR") {
						reject(new Error(message.message));
					}
				};

				messageHandlers.set("FILE_CONTENT" + path, handler);
				ws?.send(JSON.stringify({ type: "READ_FILE", path }));
			});
		},
		[ws, messageHandlers]
	);

	const saveFile = useCallback(
		(path: string, content: string): Promise<void> => {
			return new Promise((resolve, reject) => {
				const handler = (message: any) => {
					if (message.type === "FILE_SAVED") {
						resolve();
					} else if (message.type === "ERROR") {
						reject(new Error(message.message));
					}
				};

				messageHandlers.set("FILE_SAVED" + path, handler);
				ws?.send(JSON.stringify({ type: "SAVE_FILE", path, content }));
			});
		},
		[ws, messageHandlers]
	);

	const searchFiles = useCallback(
		(term: string) => {
			if (term.trim()) {
				setIsSearching(true);
				setSearchTerm(term);
				ws?.send(JSON.stringify({ type: "SEARCH_FILES", term }));
			} else {
				clearSearch();
			}
		},
		[ws]
	);

	const clearSearch = useCallback(() => {
		setIsSearching(false);
		setSearchTerm("");
		listFiles(currentPath);
	}, [currentPath, listFiles]);

	return (
		<FileSystemContext.Provider
			value={{
				files,
				currentPath,
				setCurrentPath,
				listFiles,
				createFolder,
				createFile,
				deleteItem,
				renameItem,
				readFile,
				saveFile,
				searchFiles,
				isSearching,
				searchTerm,
				clearSearch,
			}}
		>
			{children}
		</FileSystemContext.Provider>
	);
}

export function useFileSystem() {
	const context = useContext(FileSystemContext);
	if (context === undefined) {
		throw new Error("useFileSystem must be used within a FileSystemProvider");
	}
	return context;
}
