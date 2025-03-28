import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import { Button, Input, Menu, MenuItem, IconButton } from "@mui/joy";
import ShareHostModal from "../../modals/ShareHostModal";

function HostViewer({
                        getHosts,
                        connectToHost,
                        setIsAddHostHidden,
                        deleteHost,
                        editHost,
                        openEditPanel,
                        shareHost,
                        onModalOpen,
                        onModalClose,
                        userRef,
                        isMenuOpen,
                        setIsMenuOpen,
                    }) {
    const [hosts, setHosts] = useState([]);
    const [filteredHosts, setFilteredHosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [collapsedFolders, setCollapsedFolders] = useState(new Set());
    const [draggedHost, setDraggedHost] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(null);
    const isMounted = useRef(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isShareModalHidden, setIsShareModalHidden] = useState(true);
    const [selectedHostForShare, setSelectedHostForShare] = useState(null);
    const [selectedHost, setSelectedHost] = useState(null);
    const anchorEl = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && anchorEl.current && !anchorEl.current.contains(event.target)) {
                setIsMenuOpen(false);
                setSelectedHost(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchHosts = async () => {
        try {
            const savedHosts = await getHosts();
            if (isMounted.current) {
                setHosts(savedHosts || []);
                setFilteredHosts(savedHosts || []);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Host fetch failed:", error);
            if (isMounted.current) {
                setHosts([]);
                setFilteredHosts([]);
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchHosts();

        const intervalId = setInterval(() => {
            fetchHosts();
        }, 2000);

        return () => {
            isMounted.current = false;
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        const filtered = hosts.filter((hostWrapper) => {
            const hostConfig = hostWrapper.config || {};
            return hostConfig.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hostConfig.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hostConfig.folder?.toLowerCase().includes(searchTerm.toLowerCase());
        });
        setFilteredHosts(filtered);
    }, [searchTerm, hosts]);

    useEffect(() => {
        if (!isShareModalHidden) {
            onModalOpen();
        } else {
            onModalClose();
        }
    }, [isShareModalHidden, onModalOpen, onModalClose]);

    const toggleFolder = (folderName) => {
        setCollapsedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderName)) {
                newSet.delete(folderName);
            } else {
                newSet.add(folderName);
            }
            return newSet;
        });
    };

    const groupHostsByFolder = (hosts) => {
        const grouped = {};
        const noFolder = [];

        const sortedHosts = [...hosts].sort((a, b) => {
            const nameA = (a.config?.name || a.config?.ip || '').toLowerCase();
            const nameB = (b.config?.name || b.config?.ip || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        sortedHosts.forEach(host => {
            const folder = host.config?.folder;
            if (folder) {
                if (!grouped[folder]) {
                    grouped[folder] = [];
                }
                grouped[folder].push(host);
            } else {
                noFolder.push(host);
            }
        });

        const sortedFolders = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

        return { grouped, sortedFolders, noFolder };
    };

    const handleDragStart = (e, host) => {
        setDraggedHost(host);
        e.dataTransfer.setData('text/plain', '');
    };

    const handleDragOver = (e, folderName) => {
        e.preventDefault();
        setIsDraggingOver(folderName);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(null);
    };

    const handleDrop = async (e, targetFolder) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(null);

        if (!draggedHost) return;

        if (draggedHost.config.folder === targetFolder) return;

        const newConfig = {
            ...draggedHost.config,
            folder: targetFolder
        };

        try {
            await editHost(draggedHost.config, newConfig);
            await fetchHosts();
        } catch (error) {
            console.error('Failed to update folder:', error);
        }

        setDraggedHost(null);
    };

    const handleDropOnNoFolder = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(null);

        if (!draggedHost || !draggedHost.config.folder) return;

        const newConfig = {
            ...draggedHost.config,
            folder: null
        };

        try {
            await editHost(draggedHost.config, newConfig);
            await fetchHosts();
        } catch (error) {
            console.error('Failed to remove from folder:', error);
        }

        setDraggedHost(null);
    };

    const handleDelete = async (e, hostWrapper) => {
        e.stopPropagation();
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            const isOwner = hostWrapper.createdBy?._id === userRef.current?.getUser()?.id;
            if (isOwner) {
                await deleteHost({ _id: hostWrapper._id });
            } else {
                await userRef.current.removeShare(hostWrapper._id);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchHosts();
        } catch (error) {
            console.error('Failed to delete/remove host:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleShare = async (hostId, username) => {
        try {
            await shareHost(hostId, username);
            await fetchHosts();
        } catch (error) {
            console.error('Failed to share host:', error);
        }
    };

    const renderHostItem = (hostWrapper) => {
        const hostConfig = hostWrapper.config || {};
        const isOwner = hostWrapper.createdBy?._id === userRef.current?.getUser()?.id;

        if (!hostConfig) {
            return null;
        }

        return (
            <div
                key={hostWrapper._id}
                className={`flex justify-between items-center bg-neutral-800 p-3 rounded-lg shadow-md border border-neutral-700 w-full cursor-grab active:cursor-grabbing hover:border-neutral-500 transition-colors ${draggedHost === hostWrapper ? 'opacity-50' : ''}`}
                draggable={isOwner}
                onDragStart={(e) => isOwner && handleDragStart(e, hostWrapper)}
                onDragEnd={() => setDraggedHost(null)}
            >
                <div className="flex items-center gap-2 flex-1">
                    <div className="text-neutral-500 cursor-grab active:cursor-grabbing">⋮⋮</div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold">{hostConfig.name || hostConfig.ip}</p>
                            {!isOwner && (
                                <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">
                                    Shared by {hostWrapper.createdBy?.username}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">
                            {hostConfig.user ? `${hostConfig.user}@${hostConfig.ip}` : `${hostConfig.ip}:${hostConfig.port}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outlined"
                        className="text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!hostWrapper.config || !hostWrapper.config.ip || !hostWrapper.config.user) {
                                return;
                            }
                            connectToHost(hostWrapper.config);
                        }}
                        disabled={isDeleting}
                        sx={{
                            backgroundColor: "#6e6e6e",
                            "&:hover": { backgroundColor: "#0f0f0f" },
                            opacity: isDeleting ? 0.5 : 1,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            borderColor: "#3d3d3d",
                            borderWidth: "2px",
                            color: "#fff",
                        }}
                    >
                        Connect
                    </Button>
                    <IconButton
                        variant="outlined"
                        className="text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHost(hostWrapper);
                            setIsMenuOpen(!isMenuOpen);
                            anchorEl.current = e.currentTarget;
                        }}
                        disabled={isDeleting}
                        sx={{
                            backgroundColor: "#6e6e6e",
                            "&:hover": { backgroundColor: "#0f0f0f" },
                            opacity: isDeleting ? 0.5 : 1,
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            borderColor: "#3d3d3d",
                            borderWidth: "2px",
                            color: "#fff",
                        }}
                    >
                        ⋮
                    </IconButton>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full p-4 text-white flex flex-col">
            <div className="flex items-center justify-between mb-2 w-full gap-2">
                <Input
                    placeholder="Search hosts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        flex: 1,
                        backgroundColor: "#6e6e6e",
                        color: "#fff",
                        "&::placeholder": { color: "#ccc" },
                    }}
                />
                <Button
                    className="text-black"
                    onClick={() => setIsAddHostHidden(false)}
                    sx={{
                        backgroundColor: "#6e6e6e",
                        "&:hover": { backgroundColor: "#0f0f0f" }
                    }}
                >
                    Add Host
                </Button>
            </div>
            <div className="flex-grow overflow-auto">
                {isLoading ? (
                    <p className="text-gray-300">Loading hosts...</p>
                ) : filteredHosts.length > 0 ? (
                    <div className="flex flex-col gap-2 w-full">
                        {(() => {
                            const { grouped, sortedFolders, noFolder } = groupHostsByFolder(filteredHosts);

                            return (
                                <>
                                    <div
                                        className={`flex flex-col gap-2 p-2 rounded-lg transition-colors ${isDraggingOver === 'no-folder' ? 'bg-neutral-700' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, 'no-folder')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDropOnNoFolder}
                                    >
                                        {noFolder.map((host) => renderHostItem(host))}
                                    </div>

                                    {sortedFolders.map((folderName) => (
                                        <div key={folderName} className="mb-2">
                                            <div
                                                className={`flex items-center gap-2 p-2 bg-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-500 transition-colors ${
                                                    isDraggingOver === folderName ? 'bg-neutral-500 border-2 border-dashed border-neutral-400' : ''
                                                }`}
                                                onClick={() => toggleFolder(folderName)}
                                                onDragOver={(e) => handleDragOver(e, folderName)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, folderName)}
                                            >
                                                <span className={`font-bold w-4 text-center transition-transform ${collapsedFolders.has(folderName) ? 'rotate-[-90deg]' : ''}`}>
                                                    ▼
                                                </span>
                                                <span className="font-bold">{folderName}</span>
                                                <span className="text-sm text-gray-300">
                                                    ({grouped[folderName].length})
                                                </span>
                                            </div>
                                            {!collapsedFolders.has(folderName) && (
                                                <div className="ml-6 mt-2 flex flex-col gap-2">
                                                    {grouped[folderName].map((host) => renderHostItem(host))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    <p className="text-gray-300">No hosts available...</p>
                )}
            </div>
            <ShareHostModal
                isHidden={isShareModalHidden}
                setIsHidden={setIsShareModalHidden}
                handleShare={handleShare}
                hostConfig={selectedHostForShare}
            />
            <Menu
                ref={menuRef}
                anchorEl={anchorEl.current}
                open={isMenuOpen}
                onClose={() => {
                    setIsMenuOpen(false);
                    setSelectedHost(null);
                }}
                sx={{
                    "& .MuiMenu-list": {
                        backgroundColor: "#6e6e6e",
                        color: "white"
                    }
                }}
            >
                {selectedHost && (
                    selectedHost.createdBy?._id === userRef.current?.getUser()?.id ? (
                        <>
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHostForShare(selectedHost);
                                    setIsShareModalHidden(false);
                                    setIsMenuOpen(false);
                                }}
                            >
                                Share
                            </MenuItem>
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEditPanel(selectedHost.config);
                                    setIsMenuOpen(false);
                                }}
                            >
                                Edit
                            </MenuItem>
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(e, selectedHost);
                                    setIsMenuOpen(false);
                                }}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </MenuItem>
                        </>
                    ) : (
                        <MenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(e, selectedHost);
                                setIsMenuOpen(false);
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Removing..." : "Remove Share"}
                        </MenuItem>
                    )
                )}
            </Menu>
        </div>
    );
}

HostViewer.propTypes = {
    getHosts: PropTypes.func.isRequired,
    connectToHost: PropTypes.func.isRequired,
    setIsAddHostHidden: PropTypes.func.isRequired,
    deleteHost: PropTypes.func.isRequired,
    editHost: PropTypes.func.isRequired,
    openEditPanel: PropTypes.func.isRequired,
    shareHost: PropTypes.func.isRequired,
    onModalOpen: PropTypes.func.isRequired,
    onModalClose: PropTypes.func.isRequired,
    userRef: PropTypes.object.isRequired,
    isMenuOpen: PropTypes.bool.isRequired,
    setIsMenuOpen: PropTypes.func.isRequired,
};

export default HostViewer;