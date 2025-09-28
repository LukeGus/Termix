import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Key,
  Folder,
  Edit,
  Trash2,
  Shield,
  Pin,
  Tag,
  Info,
  FolderMinus,
  Pencil,
  X,
  Check,
  Upload,
  Server,
  User,
} from "lucide-react";
import {
  getCredentials,
  deleteCredential,
  updateCredential,
  renameCredentialFolder,
  deployCredentialToHost,
  getSSHHosts,
} from "@/ui/main-axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useConfirmation } from "@/hooks/use-confirmation.ts";
import CredentialViewer from "./CredentialViewer";
import type {
  Credential,
  CredentialsManagerProps,
} from "../../../../types/index.js";

export function CredentialsManager({
  onEditCredential,
}: CredentialsManagerProps) {
  const { t } = useTranslation();
  const { confirmWithToast } = useConfirmation();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewer, setShowViewer] = useState(false);
  const [viewingCredential, setViewingCredential] = useState<Credential | null>(
    null,
  );
  const [draggedCredential, setDraggedCredential] = useState<Credential | null>(
    null,
  );
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [operationLoading, setOperationLoading] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [deployingCredential, setDeployingCredential] =
    useState<Credential | null>(null);
  const [availableHosts, setAvailableHosts] = useState<any[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>("");
  const [deployLoading, setDeployLoading] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    fetchCredentials();
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      const hosts = await getSSHHosts();
      setAvailableHosts(hosts);
    } catch (err) {
      console.error("Failed to fetch hosts:", err);
    }
  };

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const data = await getCredentials();
      setCredentials(data);
      setError(null);
    } catch (err) {
      setError(t("credentials.failedToFetchCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (credential: Credential) => {
    if (onEditCredential) {
      onEditCredential(credential);
    }
  };

  const handleDeploy = (credential: Credential) => {
    if (credential.authType !== "key") {
      toast.error("Only SSH key-based credentials can be deployed");
      return;
    }
    if (!credential.publicKey) {
      toast.error("Public key is required for deployment");
      return;
    }
    setDeployingCredential(credential);
    setSelectedHostId("");
    setShowDeployDialog(true);
  };

  const performDeploy = async () => {
    if (!deployingCredential || !selectedHostId) {
      toast.error("Please select a target host");
      return;
    }

    setDeployLoading(true);
    try {
      const result = await deployCredentialToHost(
        deployingCredential.id,
        parseInt(selectedHostId),
      );

      if (result.success) {
        toast.success(result.message || "SSH key deployed successfully");
        setShowDeployDialog(false);
        setDeployingCredential(null);
        setSelectedHostId("");
      } else {
        toast.error(result.error || "Deployment failed");
      }
    } catch (error) {
      console.error("Deployment error:", error);
      toast.error("Failed to deploy SSH key");
    } finally {
      setDeployLoading(false);
    }
  };

  const handleDelete = async (credentialId: number, credentialName: string) => {
    confirmWithToast(
      t("credentials.confirmDeleteCredential", { name: credentialName }),
      async () => {
        try {
          await deleteCredential(credentialId);
          toast.success(
            t("credentials.credentialDeletedSuccessfully", {
              name: credentialName,
            }),
          );
          await fetchCredentials();
          window.dispatchEvent(new CustomEvent("credentials:changed"));
        } catch (err: any) {
          if (err.response?.data?.details) {
            toast.error(
              `${err.response.data.error}\n${err.response.data.details}`,
            );
          } else {
            toast.error(t("credentials.failedToDeleteCredential"));
          }
        }
      },
      "destructive",
    );
  };

  const handleRemoveFromFolder = async (credential: Credential) => {
    confirmWithToast(
      t("credentials.confirmRemoveFromFolder", {
        name: credential.name || credential.username,
        folder: credential.folder,
      }),
      async () => {
        try {
          setOperationLoading(true);
          const updatedCredential = { ...credential, folder: "" };
          await updateCredential(credential.id, updatedCredential);
          toast.success(
            t("credentials.removedFromFolder", {
              name: credential.name || credential.username,
            }),
          );
          await fetchCredentials();
          window.dispatchEvent(new CustomEvent("credentials:changed"));
        } catch (err) {
          toast.error(t("credentials.failedToRemoveFromFolder"));
        } finally {
          setOperationLoading(false);
        }
      },
    );
  };

  const handleFolderRename = async (oldName: string) => {
    if (!editingFolderName.trim() || editingFolderName === oldName) {
      setEditingFolder(null);
      setEditingFolderName("");
      return;
    }

    try {
      setOperationLoading(true);
      await renameCredentialFolder(oldName, editingFolderName.trim());
      toast.success(
        t("credentials.folderRenamed", {
          oldName,
          newName: editingFolderName.trim(),
        }),
      );
      await fetchCredentials();
      window.dispatchEvent(new CustomEvent("credentials:changed"));
      setEditingFolder(null);
      setEditingFolderName("");
    } catch (err) {
      toast.error(t("credentials.failedToRenameFolder"));
    } finally {
      setOperationLoading(false);
    }
  };

  const startFolderEdit = (folderName: string) => {
    setEditingFolder(folderName);
    setEditingFolderName(folderName);
  };

  const cancelFolderEdit = () => {
    setEditingFolder(null);
    setEditingFolderName("");
  };

  const handleDragStart = (e: React.DragEvent, credential: Credential) => {
    setDraggedCredential(credential);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragEnd = () => {
    setDraggedCredential(null);
    setDragOverFolder(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverFolder(folderName);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverFolder(null);

    if (!draggedCredential) return;

    const newFolder =
      targetFolder === t("credentials.uncategorized") ? "" : targetFolder;

    if (draggedCredential.folder === newFolder) {
      setDraggedCredential(null);
      return;
    }

    try {
      setOperationLoading(true);
      const updatedCredential = { ...draggedCredential, folder: newFolder };
      await updateCredential(draggedCredential.id, updatedCredential);
      toast.success(
        t("credentials.movedToFolder", {
          name: draggedCredential.name || draggedCredential.username,
          folder: targetFolder,
        }),
      );
      await fetchCredentials();
      window.dispatchEvent(new CustomEvent("credentials:changed"));
    } catch (err) {
      toast.error(t("credentials.failedToMoveToFolder"));
    } finally {
      setOperationLoading(false);
      setDraggedCredential(null);
    }
  };

  const filteredAndSortedCredentials = useMemo(() => {
    let filtered = credentials;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = credentials.filter((credential) => {
        const searchableText = [
          credential.name || "",
          credential.username,
          credential.description || "",
          ...(credential.tags || []),
          credential.authType,
          credential.keyType || "",
        ]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(query);
      });
    }

    return filtered.sort((a, b) => {
      const aName = a.name || a.username;
      const bName = b.name || b.username;
      return aName.localeCompare(bName);
    });
  }, [credentials, searchQuery]);

  const credentialsByFolder = useMemo(() => {
    const grouped: { [key: string]: Credential[] } = {};

    filteredAndSortedCredentials.forEach((credential) => {
      const folder = credential.folder || t("credentials.uncategorized");
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(credential);
    });

    const sortedFolders = Object.keys(grouped).sort((a, b) => {
      if (a === t("credentials.uncategorized")) return -1;
      if (b === t("credentials.uncategorized")) return 1;
      return a.localeCompare(b);
    });

    const sortedGrouped: { [key: string]: Credential[] } = {};
    sortedFolders.forEach((folder) => {
      sortedGrouped[folder] = grouped[folder];
    });

    return sortedGrouped;
  }, [filteredAndSortedCredentials, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-muted-foreground">
            {t("credentials.loadingCredentials")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchCredentials} variant="outline">
            {t("credentials.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {t("credentials.sshCredentials")}
            </h2>
            <p className="text-muted-foreground">
              {t("credentials.credentialsCount", { count: 0 })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchCredentials} variant="outline" size="sm">
              {t("credentials.refresh")}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("credentials.noCredentials")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("credentials.noCredentialsMessage")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold">
            {t("credentials.sshCredentials")}
          </h2>
          <p className="text-muted-foreground">
            {t("credentials.credentialsCount", {
              count: filteredAndSortedCredentials.length,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchCredentials} variant="outline" size="sm">
            {t("credentials.refresh")}
          </Button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("placeholders.searchCredentials")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 pb-20">
          {Object.entries(credentialsByFolder).map(
            ([folder, folderCredentials]) => (
              <div
                key={folder}
                className={`border rounded-md transition-all duration-200 ${
                  dragOverFolder === folder
                    ? "border-blue-500 bg-blue-500/10"
                    : ""
                }`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, folder)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder)}
              >
                <Accordion
                  type="multiple"
                  defaultValue={Object.keys(credentialsByFolder)}
                >
                  <AccordionItem value={folder} className="border-none">
                    <AccordionTrigger className="px-2 py-1 bg-muted/20 border-b hover:no-underline rounded-t-md">
                      <div className="flex items-center gap-2 flex-1">
                        <Folder className="h-4 w-4" />
                        {editingFolder === folder ? (
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              value={editingFolderName}
                              onChange={(e) =>
                                setEditingFolderName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleFolderRename(folder);
                                if (e.key === "Escape") cancelFolderEdit();
                              }}
                              className="h-6 text-sm px-2 flex-1"
                              autoFocus
                              disabled={operationLoading}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFolderRename(folder);
                              }}
                              className="h-6 w-6 p-0"
                              disabled={operationLoading}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelFolderEdit();
                              }}
                              className="h-6 w-6 p-0"
                              disabled={operationLoading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span
                              className="font-medium cursor-pointer hover:text-blue-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (folder !== t("credentials.uncategorized")) {
                                  startFolderEdit(folder);
                                }
                              }}
                              title={
                                folder !== t("credentials.uncategorized")
                                  ? "Click to rename folder"
                                  : ""
                              }
                            >
                              {folder}
                            </span>
                            {folder !== t("credentials.uncategorized") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startFolderEdit(folder);
                                }}
                                className="h-4 w-4 p-0 opacity-50 hover:opacity-100 transition-opacity"
                                title="Rename folder"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {folderCredentials.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {folderCredentials.map((credential) => (
                          <TooltipProvider key={credential.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(e, credential)
                                  }
                                  onDragEnd={handleDragEnd}
                                  className={`bg-dark-bg-input border border-input rounded-lg cursor-pointer hover:shadow-lg hover:border-blue-400/50 hover:bg-dark-hover-alt transition-all duration-200 p-3 group relative ${
                                    draggedCredential?.id === credential.id
                                      ? "opacity-50 scale-95"
                                      : ""
                                  }`}
                                  onClick={() => handleEdit(credential)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <h3 className="font-medium truncate text-sm">
                                          {credential.name ||
                                            `${credential.username}`}
                                        </h3>
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {credential.username}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {credential.authType === "password"
                                          ? t("credentials.password")
                                          : t("credentials.sshKey")}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0 ml-1">
                                      {credential.folder &&
                                        credential.folder !== "" && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleRemoveFromFolder(
                                                    credential,
                                                  );
                                                }}
                                                className="h-5 w-5 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-500/10"
                                                disabled={operationLoading}
                                              >
                                                <FolderMinus className="h-3 w-3" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>
                                                Remove from folder "
                                                {credential.folder}"
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEdit(credential);
                                            }}
                                            className="h-5 w-5 p-0 hover:bg-blue-500/10"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Edit credential</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      {credential.authType === "key" && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeploy(credential);
                                              }}
                                              className="h-5 w-5 p-0 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                            >
                                              <Upload className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Deploy SSH key to host</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDelete(
                                                credential.id,
                                                credential.name ||
                                                  credential.username,
                                              );
                                            }}
                                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Delete credential</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>

                                  <div className="mt-2 space-y-1">
                                    {credential.tags &&
                                      credential.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {credential.tags
                                            .slice(0, 6)
                                            .map((tag, index) => (
                                              <Badge
                                                key={index}
                                                variant="outline"
                                                className="text-xs px-1 py-0"
                                              >
                                                <Tag className="h-2 w-2 mr-0.5" />
                                                {tag}
                                              </Badge>
                                            ))}
                                          {credential.tags.length > 6 && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs px-1 py-0"
                                            >
                                              +{credential.tags.length - 6}
                                            </Badge>
                                          )}
                                        </div>
                                      )}

                                    <div className="flex flex-wrap gap-1">
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-1 py-0"
                                      >
                                        {credential.authType === "password" ? (
                                          <Key className="h-2 w-2 mr-0.5" />
                                        ) : (
                                          <Shield className="h-2 w-2 mr-0.5" />
                                        )}
                                        {credential.authType}
                                      </Badge>
                                      {credential.authType === "key" &&
                                        credential.keyType && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs px-1 py-0"
                                          >
                                            {credential.keyType}
                                          </Badge>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-center">
                                  <p className="font-medium">
                                    Click to edit credential
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Drag to move between folders
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ),
          )}
        </div>
      </ScrollArea>

      {showViewer && viewingCredential && (
        <CredentialViewer
          credential={viewingCredential}
          onClose={() => setShowViewer(false)}
          onEdit={() => {
            setShowViewer(false);
            handleEdit(viewingCredential);
          }}
        />
      )}

      <Sheet open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <SheetContent className="w-[500px] max-w-[50vw] overflow-y-auto">
          <SheetHeader className="space-y-6 pb-8">
            <SheetTitle className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-semibold">Deploy SSH Key</div>
                <div className="text-sm font-normal text-zinc-600 dark:text-zinc-400 mt-1">
                  Deploy public key to target server
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {deployingCredential && (
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50">
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center">
                  <Key className="h-4 w-4 mr-2 text-zinc-500" />
                  Source Credential
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                      <User className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Name
                      </div>
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {deployingCredential.name ||
                          deployingCredential.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                      <User className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Username
                      </div>
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {deployingCredential.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                      <Key className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Key Type
                      </div>
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {deployingCredential.keyType || "SSH Key"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center">
                <Server className="h-4 w-4 mr-2 text-zinc-500" />
                Target Host
              </label>
              <Select value={selectedHostId} onValueChange={setSelectedHostId}>
                <SelectTrigger className="h-12 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                  <SelectValue placeholder="Choose a host to deploy to..." />
                </SelectTrigger>
                <SelectContent>
                  {availableHosts.map((host) => (
                    <SelectItem key={host.id} value={host.id.toString()}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                          <Server className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                          <div className="font-medium text-zinc-800 dark:text-zinc-200">
                            {host.name || host.ip}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {host.username}@{host.ip}:{host.port}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start space-x-3">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Deployment Process</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    This will safely add the public key to the target host's
                    ~/.ssh/authorized_keys file without overwriting existing
                    keys. The operation is reversible.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="mt-8 flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeployDialog(false)}
              disabled={deployLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={performDeploy}
              disabled={!selectedHostId || deployLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {deployLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Deploying...
                </div>
              ) : (
                <div className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Deploy SSH Key
                </div>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
