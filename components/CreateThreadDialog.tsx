'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Plus, Upload } from 'lucide-react';
import type { ForumThread, StackPeptideInfo, DoseProtocol } from '@/types';
import { usePepetideBalance } from '@/hooks/use-pepetide-balance';
import { formatTokenBalance } from '@/lib/holder';
import { getProtocols } from '@/lib/db';
import {
  clearThreadComposerDraft,
  consumePreparedThreadDraft,
  loadCommunityAlias,
  loadThreadComposerDraft,
  saveCommunityAlias,
  saveThreadComposerDraft,
} from '@/lib/community-storage';

interface CreateThreadDialogProps {
  onClose: () => void;
  onThreadCreated: (thread: ForumThread) => void;
}

export default function CreateThreadDialog({ onClose, onThreadCreated }: CreateThreadDialogProps) {
  const { publicKey, connected, handle, balance, tier, voteWeight, isTokenConfigured } = usePepetideBalance();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('');
  const [useWalletIdentity, setUseWalletIdentity] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stackPeptides, setStackPeptides] = useState<StackPeptideInfo[]>([]);
  const [sourceLabel, setSourceLabel] = useState('');
  const [templateKind, setTemplateKind] = useState<'stack' | 'question' | 'update'>('stack');
  const [myProtocols, setMyProtocols] = useState<DoseProtocol[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePrews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const availableTags = ['cutting', 'bulking', 'anti-aging', 'recovery', 'cognitive', 'longevity', 'performance'];

  useEffect(() => {
    loadMyProtocols();

    const preparedDraft = consumePreparedThreadDraft();
    const savedDraft = preparedDraft || loadThreadComposerDraft();
    const savedUsername = loadCommunityAlias();

    setUsername(savedUsername);
    setTitle(savedDraft.title);
    setContent(savedDraft.content);
    setSelectedTags(savedDraft.tags);
    setStackPeptides(savedDraft.stackPeptides);
    setSourceLabel(savedDraft.sourceLabel || '');
    setTemplateKind(savedDraft.templateKind || 'stack');
  }, []);

  useEffect(() => {
    saveThreadComposerDraft({
      title,
      content,
      tags: selectedTags,
      stackPeptides,
      sourceLabel,
      templateKind,
    });
  }, [title, content, selectedTags, stackPeptides, sourceLabel, templateKind]);

  useEffect(() => {
    if (username.trim()) {
      saveCommunityAlias(username);
    }
  }, [username]);

  useEffect(() => {
    if (useWalletIdentity && handle) {
      setUsername(handle);
    }
  }, [useWalletIdentity, handle]);

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

  const handleUpdatePeptide = (index: number, field: keyof StackPeptideInfo, value: StackPeptideInfo[keyof StackPeptideInfo]) => {
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
      saveCommunityAlias(username);

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
          console.log('Images uploaded successfully:', urls);
        } else {
          const errorData = await uploadResponse.json();
          console.error('Image upload failed:', errorData);
          alert(`Image upload failed: ${errorData.error || 'Unknown error'}. Thread will be created without images.`);
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
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          walletAddress: useWalletIdentity && publicKey ? publicKey.toBase58() : undefined
        })
      });

      if (response.ok) {
        const newThread = await response.json();
        clearThreadComposerDraft();
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

  const dialogTitle =
    templateKind === 'question'
      ? 'Ask a Question'
      : templateKind === 'update'
      ? 'Post an Update'
      : 'Share Your Stack';
  const templateDescription =
    templateKind === 'question'
      ? 'Use this when you want feedback, troubleshooting, or opinions from the community.'
      : templateKind === 'update'
      ? 'Use this for follow-ups, progress notes, or changes since your last post.'
      : 'Use this when the main value is sharing a stack or tracked setup.';

  const titleLabel = templateKind === 'question' ? 'Question Title' : 'Thread Title';
  const titlePlaceholder =
    templateKind === 'question'
      ? 'e.g., Thoughts on this recovery stack?'
      : templateKind === 'update'
      ? 'e.g., Progress update - week 3'
      : 'e.g., My cutting stack - BPC-157 + CJC/Ipamorelin';
  const contentLabel =
    templateKind === 'question'
      ? 'Question / Context'
      : templateKind === 'update'
      ? 'Update / Notes'
      : 'Description / Experience';
  const contentPlaceholder =
    templateKind === 'question'
      ? 'Share your question, what you have tried, and what feedback you want...'
      : templateKind === 'update'
      ? 'Share what changed, what you noticed, and what kind of feedback you want...'
      : 'Share your experience, goals, results, etc...';
  const stackLabel = templateKind === 'stack' ? 'Your Stack' : 'Related Stack';
  const submitLabel =
    templateKind === 'question'
      ? 'Post Question'
      : templateKind === 'update'
      ? 'Post Update'
      : 'Post Thread';

  const applyTemplateKind = (nextKind: 'stack' | 'question' | 'update') => {
    setTemplateKind(nextKind);

    if (title.trim() || content.trim()) {
      return;
    }

    if (nextKind === 'question') {
      setTitle('Need feedback on my current stack');
      setContent([
        'Question for the community:',
        '- ',
        '',
        'Current context:',
        '- ',
        '',
        'What I have tried so far:',
        '- ',
      ].join('\n'));
      return;
    }

    if (nextKind === 'update') {
      setTitle(`Progress update - ${new Date().toLocaleDateString()}`);
      setContent([
        'Quick update:',
        '- ',
        '',
        'What changed:',
        '- ',
        '',
        'What I noticed:',
        '- ',
      ].join('\n'));
      return;
    }

    setTitle('');
    setContent('');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sourceLabel && (
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-cyan-200">
              {sourceLabel}. Review anything you want before posting.
            </div>
          )}

          <div>
            <Label>Thread Type</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                { id: 'question', label: 'Question' },
                { id: 'update', label: 'Update' },
                { id: 'stack', label: 'Stack' },
              ] as const).map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={templateKind === option.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyTemplateKind(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {templateDescription}
            </p>
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Username / Alias</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your pseudonym..."
              className="mt-1"
              disabled={useWalletIdentity}
            />
            <p className="text-xs text-slate-500 mt-1">
              Use any alias you want. Your alias and thread draft are only saved locally on this device.
            </p>
            {connected && isTokenConfigured && (
              <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-emerald-300/40 bg-emerald-50/50 p-3 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-100">
                <input
                  type="checkbox"
                  checked={useWalletIdentity}
                  onChange={(e) => setUseWalletIdentity(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold">Post with holder badge</span>
                  <span className="block opacity-80">
                    {handle ?? 'Connected wallet'} · {formatTokenBalance(balance)} $PEPETIDE · {tier.label} · {voteWeight}x thread vote weight.
                  </span>
                </span>
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">{titleLabel}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
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
            <Label htmlFor="content">{contentLabel}</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentPlaceholder}
              className="mt-1 w-full min-h-[120px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-y"
            />
          </div>

          {/* Stack Peptides */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{stackLabel}</Label>
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
                No peptides added yet. Stack details are optional, but they make threads much easier to browse and import.
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
            {submitting ? 'Posting...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
