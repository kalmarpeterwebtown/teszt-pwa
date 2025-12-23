import { useRef, useState } from 'react';
import type { Attachment } from '../../types';
import { createAttachment, downloadAttachment, deleteAttachment, getAttachmentMeta } from '../../services/db';
import { Button } from './Button';
import { ArrowDownTrayIcon, TrashIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FileUploadProps {
  attachmentIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  label?: string;
}

export function FileUpload({ attachmentIds, onChange, disabled, label }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAttachments = async () => {
    const metas = await Promise.all(attachmentIds.map((id) => getAttachmentMeta(id)));
    setAttachments(metas.filter(Boolean) as Attachment[]);
  };

  useState(() => {
    if (attachmentIds.length > 0) {
      loadAttachments();
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const newIds: string[] = [];
      for (const file of Array.from(files)) {
        const attachment = await createAttachment(file);
        newIds.push(attachment.id);
      }
      onChange([...attachmentIds, ...newIds]);
      toast.success(`${newIds.length} fájl feltöltve`);
      loadAttachments();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Hiba a feltöltéskor');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadAttachment(id);
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Hiba a letöltéskor');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAttachment(id);
      onChange(attachmentIds.filter((aid) => aid !== id));
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Fájl törölve');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Hiba a törléskor');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <PaperClipIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{attachment.fileName}</span>
                <span className="text-xs text-gray-500">({formatSize(attachment.size)})</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(attachment.id)}>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(attachment.id)}>
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <PaperClipIcon className="h-4 w-4 mr-2" />
            {loading ? 'Feltöltés...' : 'Fájl csatolása'}
          </label>
        </div>
      )}
    </div>
  );
}
