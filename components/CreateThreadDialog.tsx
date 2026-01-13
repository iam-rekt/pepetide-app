'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import type { ForumThread, StackPeptideInfo, DoseProtocol } from '@/types';
import { getProtocols } from '@/lib/db';
import { hashIP } from '@/lib/hash';

interface CreateThreadDialogProps {
  onClose: () => void;
  onThreadCreated: (thread: ForumThread) => void;
}

export default function CreateThreadDialog({ onClose, onThreadCreated }: CreateThreadDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stackPeptides, setStackPeptides] = useState<StackPeptideInfo[]>([]);
  const [myProtocols, setMyProtocols] = useState<DoseProtocol[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePrews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const availableTags = ['cutting', 'bulking', 'anti-aging', 'recovery', 'cognitive', 'longevity', 'performance'];

  useEffect(() => {
    loadMyProtocols();
    // Load saved username from localStorage
    const savedUsername = localStorage.getItem('forumUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const loadMyProtocols = async () => {
    const protocols = await getProtocols();
    setMyProtocols(protocols.filter(p => p.isActive));
  };

  const handleAddPeptideManually = () => {
    setStackPeptides([...stackPeptides, {
      peptideName: '',
      dosage: 0,
      dosageUnit: 'mcg',
      frequency: 'daily',
      timeOfDay: '',
      duration: '',
      notes: ''
    }]);
  };

  const handleImportFromProtocol = (protocol: DoseProtocol) => {
    const newPeptide: StackPeptideInfo = {
      peptideName: protocol.peptideName,
      dosage: protocol.targetDose,
      dosageUnit: protocol.targetDoseUnit,
      frequency: protocol.frequency === 'custom' ? 'custom schedule' : protocol.frequency,
      timeOfDay: protocol.timeOfDay || protocol.specificTime || '',
      duration: protocol.endDate ? `Until ${new Date(protocol.endDate).toLocaleDateString()}` : 'Ongoing',
      notes: ''
    };
    setStackPeptides([...stackPeptides, newPeptide]);
  };

  const handleRemovePeptide = (index: number) => {
    setStackPeptides(stackPeptides.filter((_, i) => i !== index));
  };

  const handleUpdatePeptide = (index: number, field: keyof StackPeptideInfo, value: any) => {
    const updated = [...stackPeptides];
    updated[index] = { ...updated[index], [field]: value };
    setStackPeptides(updated);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) {
      alert('Maximum 4 images allowed');
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePrews.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !username.trim()) {
      alert('Please fill in title, content, and username');
      return;
    }

    setSubmitting(true);

    try {
      // Save username for next time
      localStorage.setItem('forumUsername', username);

      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(image => {
          formData.append('images', image);
        });

        const uploadResponse = await fetch('/api/forum/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const { urls } = await uploadResponse.json();
          imageUrls = urls;
        }
      }

      // Create thread
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          username,
          tags: selectedTags,
          stackPeptides: stackPeptides.length > 0 ? stackPeptides : undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined
        })
      });

      if (response.ok) {
        const newThread = await response.json();
        onThreadCreated(newThread);
      } else {
        throw new Error('Failed to create thread');
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to create thread. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Stack</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <Label htmlFor="username">Username / Alias</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your pseudonym..."
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Choose a memorable alias. Your posts will be associated with this name.
            </p>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Thread Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My cutting stack - BPC-157 + CJC/Ipamorelin"
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (select all that apply)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableTags.map(tag => (
                <Button
                  key={tag}
                  type="button"
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Description / Experience</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience, goals, results, etc..."
              className="mt-1 w-full min-h-[120px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-y"
            />
          </div>

          {/* Stack Peptides */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Your Stack</Label>
              <div className="flex gap-2">
                {myProtocols.length > 0 && (
                  <select
                    onChange={(e) => {
                      const protocol = myProtocols.find(p => p.id === e.target.value);
                      if (protocol) handleImportFromProtocol(protocol);
                      e.target.value = '';
                    }}
                    className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                  >
                    <option value="">Import from my protocols...</option>
                    {myProtocols.map(p => (
                      <option key={p.id} value={p.id}>{p.peptideName}</option>
                    ))}
                  </select>
                )}
                <Button type="button" size="sm" variant="outline" onClick={handleAddPeptideManually}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Peptide
                </Button>
              </div>
            </div>

            {stackPeptides.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No peptides added yet. Add peptides to share your stack details.
              </p>
            ) : (
              <div className="space-y-2">
                {stackPeptides.map((peptide, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Peptide name"
                          value={peptide.peptideName}
                          onChange={(e) => handleUpdatePeptide(index, 'peptideName', e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder="Dosage"
                            value={peptide.dosage || ''}
                            onChange={(e) => handleUpdatePeptide(index, 'dosage', parseFloat(e.target.value))}
                            className="text-sm flex-1"
                          />
                          <select
                            value={peptide.dosageUnit}
                            onChange={(e) => handleUpdatePeptide(index, 'dosageUnit', e.target.value)}
                            className="text-sm px-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                          >
                            <option value="mcg">mcg</option>
                            <option value="mg">mg</option>
                          </select>
                        </div>
                        <Input
                          placeholder="Frequency (e.g., daily, 2x/week)"
                          value={peptide.frequency}
                          onChange={(e) => handleUpdatePeptide(index, 'frequency', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Time (e.g., morning, 8pm)"
                          value={peptide.timeOfDay || ''}
                          onChange={(e) => handleUpdatePeptide(index, 'timeOfDay', e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Duration (optional)"
                          value={peptide.duration || ''}
                          onChange={(e) => handleUpdatePeptide(index, 'duration', e.target.value)}
                          className="text-sm col-span-2"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePeptide(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <Label>Images (optional, max 4)</Label>
            <div className="mt-2 space-y-2">
              {imagePrews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {imagePrews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded" />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {images.length < 4 && (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Click to upload images
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Thread'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
