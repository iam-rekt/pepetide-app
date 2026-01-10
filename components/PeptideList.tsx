'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Beaker, Edit2, Trash2, Save, X, Plus, AlertTriangle } from 'lucide-react';
import { getPeptides, getVialsByPeptide, updatePeptide, deletePeptide } from '@/lib/db';
import type { Peptide, ViewMode } from '@/types';

interface PeptideListProps {
  onNavigate: (view: ViewMode) => void;
}

export default function PeptideList({ onNavigate }: PeptideListProps) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Peptide>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [vialCounts, setVialCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPeptides();
  }, []);

  async function loadPeptides() {
    setLoading(true);
    try {
      const allPeptides = await getPeptides();
      setPeptides(allPeptides);

      // Load vial counts for each peptide
      const counts: Record<string, number> = {};
      await Promise.all(
        allPeptides.map(async (peptide) => {
          const vials = await getVialsByPeptide(peptide.id);
          counts[peptide.id] = vials.filter(v => v.isActive).length;
        })
      );
      setVialCounts(counts);
    } catch (error) {
      console.error('Error loading peptides:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(peptide: Peptide) {
    setEditingId(peptide.id);
    setEditForm({
      name: peptide.name,
      description: peptide.description,
      commonDosageRange: peptide.commonDosageRange,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id: string) {
    if (!editForm.name) {
      alert('Peptide name is required');
      return;
    }

    try {
      await updatePeptide(id, editForm);
      await loadPeptides();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating peptide:', error);
      alert('Failed to update peptide');
    }
  }

  async function handleDelete(id: string) {
    const vialCount = vialCounts[id] || 0;

    if (vialCount > 0) {
      const confirmed = confirm(
        `This peptide has ${vialCount} active vial(s). Deleting it will remove all associated vials and protocols. Are you sure?`
      );
      if (!confirmed) {
        setDeletingId(null);
        return;
      }
    }

    try {
      await deletePeptide(id);
      await loadPeptides();
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting peptide:', error);
      alert('Failed to delete peptide');
    }
  }

  if (loading && peptides.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your peptides...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-white/5 dark:bg-slate-950/5 border border-white/20 dark:border-slate-600/20 backdrop-blur-sm p-4 sm:p-8"
      >
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-200 dark:to-slate-100 rounded-xl shadow-lg">
                <Beaker className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  My Peptides
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your peptide library
                </p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate('add-stack')}
              size="sm"
              className="w-full sm:w-auto bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black dark:from-slate-200 dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Empty State */}
      {peptides.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border border-dashed border-white/30 dark:border-blue-800/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-slate-300/20 to-slate-400/20 dark:from-slate-700/20 dark:to-slate-600/20 flex items-center justify-center">
                <Beaker className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Peptides Yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by adding your first peptide stack
              </p>
              <Button
                onClick={() => onNavigate('add-stack')}
                className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black dark:from-slate-200 dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Stack
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Peptide List */
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {peptides.map((peptide, index) => (
              <motion.div
                key={peptide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border border-white/20 dark:border-blue-800/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    {editingId === peptide.id ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${peptide.id}`}>Peptide Name *</Label>
                          <Input
                            id={`edit-name-${peptide.id}`}
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="h-12 text-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-desc-${peptide.id}`}>Description</Label>
                          <textarea
                            id={`edit-desc-${peptide.id}`}
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Common Dosage Range (Optional)</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={editForm.commonDosageRange?.min || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  commonDosageRange: {
                                    min: parseFloat(e.target.value) || 0,
                                    max: editForm.commonDosageRange?.max || 0,
                                    unit: editForm.commonDosageRange?.unit || 'mcg',
                                  },
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={editForm.commonDosageRange?.max || ''}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  commonDosageRange: {
                                    min: editForm.commonDosageRange?.min || 0,
                                    max: parseFloat(e.target.value) || 0,
                                    unit: editForm.commonDosageRange?.unit || 'mcg',
                                  },
                                })
                              }
                            />
                            <select
                              value={editForm.commonDosageRange?.unit || 'mcg'}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  commonDosageRange: {
                                    min: editForm.commonDosageRange?.min || 0,
                                    max: editForm.commonDosageRange?.max || 0,
                                    unit: e.target.value as 'mcg' | 'mg',
                                  },
                                })
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="mcg">mcg</option>
                              <option value="mg">mg</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => saveEdit(peptide.id)}
                            className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 dark:from-slate-300 dark:to-slate-200 dark:hover:from-slate-200 dark:hover:to-slate-100 dark:text-slate-900"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button onClick={cancelEdit} variant="outline">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : deletingId === peptide.id ? (
                      /* Delete Confirmation */
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                              Confirm Deletion
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-400">
                              Are you sure you want to delete "{peptide.name}"?
                              {vialCounts[peptide.id] > 0 && (
                                <span className="block mt-1 font-medium">
                                  This will also delete {vialCounts[peptide.id]} associated vial(s) and all protocols.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDelete(peptide.id)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Yes, Delete
                          </Button>
                          <Button onClick={() => setDeletingId(null)} variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold">{peptide.name}</h3>
                            {vialCounts[peptide.id] > 0 && (
                              <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                {vialCounts[peptide.id]} {vialCounts[peptide.id] === 1 ? 'vial' : 'vials'}
                              </span>
                            )}
                          </div>

                          {peptide.description && (
                            <p className="text-muted-foreground mb-3">{peptide.description}</p>
                          )}

                          {peptide.commonDosageRange && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <span className="text-sm text-muted-foreground">Common dosage:</span>
                              <span className="font-semibold text-purple-900 dark:text-purple-300">
                                {peptide.commonDosageRange.min}-{peptide.commonDosageRange.max} {peptide.commonDosageRange.unit}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 text-xs text-muted-foreground">
                            Added {new Date(peptide.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEdit(peptide)}
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setDeletingId(peptide.id)}
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
