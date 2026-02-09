import { useState, useEffect } from 'react';
import { SchemaBuilder, SchemaField } from './SchemaBuilder';
import {
  Table,
  TableBody,
  TableCell,
  HeaderCell,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table';
import Modal from '../../../shared/components/ui/modal/Modal';
import Input from '../../../shared/components/ui/input/Input';
import Combobox from '../../../shared/components/ui/combobox/Combobox';
import { Trash2, Save, AlertCircle, Database, Variable, Edit2 } from 'lucide-react';
import { ServiceProviderConfig } from '../../email/components/tabs/service/utils/servicePresets';

export const ServiceManager = () => {
  const [services, setServices] = useState<Record<string, ServiceProviderConfig>>({});
  const [loading, setLoading] = useState(true);

  // Edit/Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceProviderConfig>>({});
  const [isNew, setIsNew] = useState(false);

  // Combobox states for tags and categories
  const [tagSearch, setTagSearch] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryInputOpen, setCategoryInputOpen] = useState(false);

  // Validation states
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    const handleAddService = () => {
      setEditingService({});
      setIsNew(true);
      setIsModalOpen(true);
    };

    window.addEventListener('add-service-click', handleAddService);
    return () => window.removeEventListener('add-service-click', handleAddService);
  }, []);

  // Reset validation errors when modal opens/closes
  useEffect(() => {
    if (!isModalOpen) {
      setNameError('');
      setUrlError('');
      setTagSearch('');
      setCategorySearch('');
      setTagInputOpen(false);
      setCategoryInputOpen(false);
    }
  }, [isModalOpen]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const gitlabFolder = localStorage.getItem('gitlab_repo_folder');
      if (!gitlabFolder) {
        console.warn('[ServiceManager] No gitlab folder configured');
        setServices({});
        setLoading(false);
        return;
      }

      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke(
        'git:read-data',
        gitlabFolder,
        'custom_providers.json',
      );

      const extractData = (res: any) => {
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return typeof res.data === 'object' ? res.data : {};
        }
        return res && typeof res === 'object' ? res : {};
      };

      const extractedData = extractData(data);
      setServices(extractedData || {});
      console.log('[ServiceManager] Loaded services:', extractedData);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices({});
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get favicon URL
  const getFaviconUrl = (url: string) => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  // Helper component for favicon display with fallback
  const FaviconIcon = ({ url }: { url: string }) => {
    const [error, setError] = useState(false);
    const faviconUrl = getFaviconUrl(url);

    if (error || !faviconUrl) {
      return <Database className="h-5 w-5 text-muted-foreground" />;
    }

    return (
      <img
        src={faviconUrl}
        alt="favicon"
        className="w-5 h-5 object-contain"
        onError={() => setError(true)}
      />
    );
  };

  // Validation function to check for duplicates
  const validateService = (name: string, url: string, currentId?: string) => {
    let hasError = false;

    // Check for duplicate name if name is provided
    if (name && name.trim()) {
      const duplicateName = Object.values(services).find(
        (s) => s.name.toLowerCase().trim() === name.toLowerCase().trim() && s.id !== currentId,
      );
      if (duplicateName) {
        setNameError(`Service "${duplicateName.name}" already exists`);
        hasError = true;
      } else {
        setNameError('');
      }
    } else {
      setNameError('');
    }

    // Check for duplicate URL if URL is provided
    if (url && url.trim()) {
      const duplicateUrl = Object.values(services).find(
        (s) => s.websiteUrl.toLowerCase().trim() === url.toLowerCase().trim() && s.id !== currentId,
      );
      if (duplicateUrl) {
        setUrlError(`URL already used by "${duplicateUrl.name}"`);
        hasError = true;
      } else {
        setUrlError('');
      }
    } else {
      setUrlError('');
    }

    return !hasError;
  };

  const handleSave = async () => {
    if (!editingService.name || !editingService.websiteUrl) {
      alert('Please fill in Service Name and Website URL');
      return;
    }

    // Validate for duplicates
    const validateSchema = (fields: SchemaField[]): boolean => {
      if (!fields || fields.length === 0) return true;
      for (const field of fields) {
        if (!field.label || !field.key) return false;
        if (field.type === 'array') {
          if (!field.itemType) return false;
          if (field.itemType === 'object') {
            if (!field.children || field.children.length === 0) return false;
            if (!validateSchema(field.children)) return false;
          }
        }
        if (field.type === 'object') {
          if (!field.children || field.children.length === 0) return false;
          if (!validateSchema(field.children)) return false;
        }
      }
      return true;
    };

    if (
      !validateService(
        editingService.name || '',
        editingService.websiteUrl || '',
        editingService.id,
      ) ||
      (editingService.commonFields && !validateSchema(editingService.commonFields as any))
    ) {
      return;
    }

    const gitlabFolder = localStorage.getItem('gitlab_repo_folder');
    if (!gitlabFolder) {
      alert('Please configure Git repository folder in General settings first.');
      return;
    }

    const id = editingService.id || editingService.name.toLowerCase().replace(/\s+/g, '-');
    const newService: ServiceProviderConfig = {
      ...editingService,
      id,
      name: editingService.name,
      websiteUrl: editingService.websiteUrl,
      defaultTags: editingService.defaultTags || [],
      defaultCategories: editingService.defaultCategories || [],
      commonFields: editingService.commonFields || [
        { label: 'Username', key: 'username', type: 'text', placeholder: 'Username' },
        { label: 'Password', key: 'password', type: 'password', placeholder: 'Password' },
      ],
    } as ServiceProviderConfig;

    const updatedServices = { ...services, [id]: newService };

    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: 'custom_providers.json',
        data: updatedServices,
      });
      setServices(updatedServices);
      setIsModalOpen(false);

      // Trigger sync status change
      localStorage.setItem('zentri_is_dirty', 'true');
      window.dispatchEvent(
        new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
      );

      console.log('[ServiceManager] Saved service:', newService.name);
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const gitlabFolder = localStorage.getItem('gitlab_repo_folder');
    if (!gitlabFolder) {
      alert('Please configure Git repository folder in General settings first.');
      return;
    }

    const updatedServices = { ...services };
    delete updatedServices[id];

    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('git:write-data', {
        folderPath: gitlabFolder,
        filename: 'custom_providers.json',
        data: updatedServices,
      });
      setServices(updatedServices);

      // Trigger sync status change
      localStorage.setItem('zentri_is_dirty', 'true');
      window.dispatchEvent(
        new CustomEvent('zentri:sync-status-changed', { detail: { isDirty: true } }),
      );

      console.log('[ServiceManager] Deleted service:', id);
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const getBadgeColor = (text: string) => {
    const colors = [
      { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
      { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
      { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
      { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
      { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' },
      { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
      { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
      { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20' },
    ];
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const filteredServices = Object.values(services);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <HeaderCell>SERVICE</HeaderCell>
              <HeaderCell>URL</HeaderCell>
              <HeaderCell>Tags</HeaderCell>
              <HeaderCell>Categories</HeaderCell>
              <HeaderCell className="text-right">Actions</HeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading services...
                </TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No services found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={getFaviconUrl(service.websiteUrl)}
                        alt={service.name}
                        className="w-6 h-6 rounded-sm object-contain flex-shrink-0"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{service.websiteUrl}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {service.defaultTags?.slice(0, 3).map((tag) => {
                        const color = getBadgeColor(tag);
                        return (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.5 ${color.bg} ${color.text} rounded text-[10px] font-medium border ${color.border}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      {(service.defaultTags?.length || 0) > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{service.defaultTags!.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {service.defaultCategories?.slice(0, 2).map((cat) => {
                        const color = getBadgeColor(cat);
                        return (
                          <span
                            key={cat}
                            className={`px-1.5 py-0.5 ${color.bg} ${color.text} rounded text-[10px] font-medium border ${color.border}`}
                          >
                            {cat}
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setIsNew(false);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isNew ? 'Add New Service' : 'Edit Service'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                !!(nameError || urlError || !editingService.name || !editingService.websiteUrl)
              }
              className={`px-4 py-2 rounded-md transition-all shadow-lg flex items-center gap-2 text-sm font-medium ${
                nameError || urlError || !editingService.name || !editingService.websiteUrl
                  ? 'bg-primary/50 text-primary-foreground cursor-not-allowed opacity-70'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Save size={16} />
              Save Service
            </button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* Service Name with Favicon */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Service Name (Required)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                {editingService.websiteUrl && <FaviconIcon url={editingService.websiteUrl} />}
              </div>
              <input
                type="text"
                value={editingService.name || ''}
                onChange={(e) => {
                  setEditingService((prev) => ({ ...prev, name: e.target.value }));
                  validateService(
                    e.target.value,
                    editingService.websiteUrl || '',
                    editingService.id,
                  );
                }}
                placeholder="Enter service name..."
                className={`flex h-10 w-full rounded-md border ${nameError ? 'border-red-500 ring-1 ring-red-500' : 'border-input'} bg-input-background ${editingService.websiteUrl ? 'pl-11' : 'pl-3'} pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              />
            </div>
            {nameError && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle size={12} />
                <span>{nameError}</span>
              </div>
            )}
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Website URL (Required)
            </label>
            <input
              type="text"
              value={editingService.websiteUrl || ''}
              onChange={(e) => {
                setEditingService((prev) => ({ ...prev, websiteUrl: e.target.value }));
                validateService(editingService.name || '', e.target.value, editingService.id);
              }}
              placeholder="https://example.com"
              className={`flex h-10 w-full rounded-md border ${urlError ? 'border-red-500 ring-1 ring-red-500' : 'border-input'} bg-input-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
            />
            {urlError && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle size={12} />
                <span>{urlError}</span>
              </div>
            )}
          </div>

          {/* Tags with Combobox */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Default Tags
            </label>
            <Input
              type="combobox"
              placeholder="Add tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              multiValue={true}
              badgeColorMode="diverse"
              badgeVariant="neon"
              badges={
                editingService.defaultTags?.map((tag) => ({
                  id: tag,
                  label: tag,
                })) || []
              }
              onBadgeRemove={(id: string | number) => {
                const newTags = (editingService.defaultTags || []).filter((t) => t !== id);
                setEditingService((prev) => ({ ...prev, defaultTags: newTags }));
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && tagSearch.trim()) {
                  const currentTags = editingService.defaultTags || [];
                  const newTag = tagSearch.trim();

                  if (!currentTags.includes(newTag)) {
                    setEditingService((prev) => ({
                      ...prev,
                      defaultTags: [...currentTags, newTag],
                    }));
                  }

                  setTagSearch('');
                  setTagInputOpen(false);
                }
              }}
              popoverOpen={tagInputOpen}
              onPopoverOpenChange={setTagInputOpen}
              popoverContent={(() => {
                const currentTags = editingService.defaultTags || [];
                const isDuplicate = currentTags.includes(tagSearch.trim());

                // Calculate existing tags from all services
                const existingTags = Array.from(
                  new Set(Object.values(services).flatMap((s) => s.defaultTags || [])),
                ).sort();

                const allTagOptions = existingTags
                  .map((t: string) => ({
                    value: t,
                    label: t,
                  }))
                  .filter((option) => !currentTags.includes(option.value));

                return (
                  <Combobox
                    searchQuery={tagSearch}
                    options={allTagOptions}
                    creatable={true}
                    creatableMessage={isDuplicate ? 'Tag "%s" already exists' : 'Create "%s"'}
                    creatableClassName={isDuplicate ? 'text-red-500 bg-red-500/5' : ''}
                    creatableIcon={
                      isDuplicate ? (
                        <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                      ) : null
                    }
                    onCreate={(newTag: string) => {
                      if (!currentTags.includes(newTag)) {
                        setEditingService((prev) => ({
                          ...prev,
                          defaultTags: [...currentTags, newTag],
                        }));
                      }
                      setTagSearch('');
                      setTagInputOpen(false);
                    }}
                    onChange={(val: string) => {
                      if (!currentTags.includes(val)) {
                        setEditingService((prev) => ({
                          ...prev,
                          defaultTags: [...currentTags, val],
                        }));
                      }
                      setTagSearch('');
                      setTagInputOpen(false);
                    }}
                  />
                );
              })()}
            />
          </div>

          {/* Categories with Combobox */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Default Categories
            </label>
            <Input
              type="combobox"
              placeholder="Add categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              multiValue={true}
              badgeColorMode="diverse"
              badgeVariant="neon"
              badges={
                editingService.defaultCategories?.map((cat) => ({
                  id: cat,
                  label: cat,
                })) || []
              }
              onBadgeRemove={(id: string | number) => {
                const newCategories = (editingService.defaultCategories || []).filter(
                  (c) => c !== id,
                );
                setEditingService((prev) => ({ ...prev, defaultCategories: newCategories }));
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && categorySearch.trim()) {
                  const currentCategories = editingService.defaultCategories || [];
                  const newCategory = categorySearch.trim();

                  if (!currentCategories.includes(newCategory)) {
                    setEditingService((prev) => ({
                      ...prev,
                      defaultCategories: [...currentCategories, newCategory],
                    }));
                  }

                  setCategorySearch('');
                  setCategoryInputOpen(false);
                }
              }}
              popoverOpen={categoryInputOpen}
              onPopoverOpenChange={setCategoryInputOpen}
              popoverContent={(() => {
                const currentCategories = editingService.defaultCategories || [];
                const isDuplicate = currentCategories.includes(categorySearch.trim());

                // Calculate existing categories from all services
                const existingCategories = Array.from(
                  new Set(Object.values(services).flatMap((s) => s.defaultCategories || [])),
                ).sort();

                const allCategoryOptions = existingCategories
                  .map((c: string) => ({
                    value: c,
                    label: c,
                  }))
                  .filter((option) => !currentCategories.includes(option.value));

                return (
                  <Combobox
                    searchQuery={categorySearch}
                    options={allCategoryOptions}
                    creatable={true}
                    creatableMessage={isDuplicate ? 'Category "%s" already exists' : 'Create "%s"'}
                    creatableClassName={isDuplicate ? 'text-red-500 bg-red-500/5' : ''}
                    creatableIcon={
                      isDuplicate ? (
                        <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                      ) : null
                    }
                    onCreate={(newCategory: string) => {
                      if (!currentCategories.includes(newCategory)) {
                        setEditingService((prev) => ({
                          ...prev,
                          defaultCategories: [...currentCategories, newCategory],
                        }));
                      }
                      setCategorySearch('');
                      setCategoryInputOpen(false);
                    }}
                    onChange={(val: string) => {
                      if (!currentCategories.includes(val)) {
                        setEditingService((prev) => ({
                          ...prev,
                          defaultCategories: [...currentCategories, val],
                        }));
                      }
                      setCategorySearch('');
                      setCategoryInputOpen(false);
                    }}
                  />
                );
              })()}
            />
          </div>
          <div className="md:col-span-2 pt-2">
            <SchemaBuilder
              fields={(editingService.commonFields as any) || []}
              onChange={(newFields) =>
                setEditingService((prev) => ({ ...prev, commonFields: newFields as any }))
              }
            />

            {(!editingService.commonFields || editingService.commonFields.length === 0) && (
              <div className="mt-2 text-center text-xs text-muted-foreground italic opacity-50">
                No custom fields defined.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
