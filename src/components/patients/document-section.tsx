'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, Download, Trash2, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/validations/document';
import { useDropzone } from 'react-dropzone';

interface Document {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploader: {
    email: string;
  };
}

interface DocumentSectionProps {
  patientId: string;
}

export function DocumentSection({ patientId }: DocumentSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/pacientes/${patientId}/documents`);
      if (!response.ok) throw new Error('Erro ao carregar documentos');
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      toast.error('Erro ao carregar documentos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Dropzone for file selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/pacientes/${patientId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      toast.success('Documento enviado com sucesso');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Download file
  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/pacientes/${patientId}/documents/${doc.id}`);
      if (!response.ok) throw new Error('Erro ao gerar URL de download');

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (error) {
      toast.error('Erro ao baixar documento');
      console.error(error);
    }
  };

  // Delete file
  const handleDelete = async (doc: Document) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const response = await fetch(`/api/pacientes/${patientId}/documents/${doc.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar documento');

      toast.success('Documento excluído com sucesso');
      fetchDocuments();
    } catch (error) {
      toast.error('Erro ao deletar documento');
      console.error(error);
    }
  };

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-600" />;
    if (fileType.startsWith('image/')) return <File className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando documentos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Documentos</h3>
          {documents.length > 0 && (
            <Badge variant="secondary">{documents.length}</Badge>
          )}
        </div>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Documento</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      {getFileIcon(selectedFile.type)}
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG ou PNG (máximo 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                  {uploading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Table */}
      {documents.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>Nenhum documento anexado</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Anexar Primeiro Documento
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Enviado Por</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getFileIcon(doc.fileType)}
                    <span className="truncate max-w-xs">{doc.filename}</span>
                  </div>
                </TableCell>
                <TableCell>{doc.fileType.split('/')[1].toUpperCase()}</TableCell>
                <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                <TableCell>{doc.uploader.email}</TableCell>
                <TableCell>
                  {new Date(doc.uploadedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
