/**
 * Lumina Reader - Universal Library Management View
 * Unified multi-format document dashboard with grid/list modes, filters, sorting, and dropzone
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BookMetadata } from '@/types/book';
import { getPlatformAdapter } from '@/services/platform';
import { UniversalBookImporter } from '@/services/storage/bookImporter';
import { LibraryDropzone } from './LibraryDropzone';
import { LibraryToolbar, LibraryCategoryFilter, LibrarySortOption } from './LibraryToolbar';
import { LibraryBookCard } from './LibraryBookCard';
import { LibraryListView } from './LibraryListView';
import { BookInfoModal } from './BookInfoModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { LibraryEmptyState } from './LibraryEmptyState';

interface LibraryPreviewProps {
  searchQuery?: string;
  openedBookName?: string;
  onOpenBook?: (book: BookMetadata) => void;
  onOpenFile?: () => void;
  onOpenStats?: () => void;
  onNotify?: (message: string) => void;
}

export const LibraryPreview: React.FC<LibraryPreviewProps> = ({
  searchQuery = '',
  openedBookName,
  onOpenBook,
  onOpenFile,
  onOpenStats,
  onNotify,
}) => {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<LibraryCategoryFilter>('all');
  const [sortBy, setSortBy] = useState<LibrarySortOption>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [infoModalBook, setInfoModalBook] = useState<BookMetadata | null>(null);
  const [deleteModalBook, setDeleteModalBook] = useState<BookMetadata | null>(null);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const adapter = getPlatformAdapter();

      // Phase 13: Purge all sample and test books to ensure clean Zen landing canvas
      const purgeKey = 'lumina_phase13_purged_sample_books';
      if (!localStorage.getItem(purgeKey)) {
        const loaded = await adapter.getAllBooks();
        for (const book of loaded) {
          await adapter.deleteBook(book.id);
        }
        localStorage.setItem(purgeKey, 'true');
        setBooks([]);
        setLoading(false);
        return;
      }

      const loaded = await adapter.getAllBooks();
      // Additional safety guard: remove any residual sample books
      const sampleIds = [
        'sample-',
        'neon-valkyrie',
        'quantum-horizons',
        'wavelet-historical',
        'quantum-garden',
        'starfarers-soliloquy',
        'zen-reading',
        'alice-in-wonderland',
      ];
      const nonSample: BookMetadata[] = [];
      for (const b of loaded) {
        if (sampleIds.some((s) => b.id.toLowerCase().includes(s))) {
          await adapter.deleteBook(b.id);
        } else {
          nonSample.push(b);
        }
      }

      setBooks(nonSample);
    } catch (err) {
      console.warn('Failed to load books catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [openedBookName]);

  // Handle Drag & Drop Files
  const handleFilesDropped = async (files: File[]) => {
    let importedCount = 0;
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer();
        await UniversalBookImporter.importFile({ name: file.name, data: buffer });
        importedCount++;
      } catch (err) {
        console.error(`Failed to import ${file.name}:`, err);
        onNotify?.(`Error importing ${file.name}: ${String(err)}`);
      }
    }
    if (importedCount > 0) {
      onNotify?.(`Successfully imported ${importedCount} document${importedCount > 1 ? 's' : ''}`);
      await loadCatalog();
    }
  };

  // Handle Book Deletion
  const handleDeleteConfirm = async (book: BookMetadata) => {
    try {
      const adapter = getPlatformAdapter();
      await adapter.deleteBook(book.id);
      setDeleteModalBook(null);
      onNotify?.(`Deleted "${book.title}" from library`);
      await loadCatalog();
    } catch (err) {
      onNotify?.(`Failed to delete book: ${String(err)}`);
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.creator?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.format.toLowerCase().includes(q)
      );
    }

    // 2. Category Tab Filter
    if (activeFilter === 'epub') {
      result = result.filter((b) => b.format === 'epub');
    } else if (activeFilter === 'comic') {
      result = result.filter((b) => ['cbz', 'cbr', 'cbt', 'cb7'].includes(b.format));
    } else if (activeFilter === 'pdf') {
      result = result.filter((b) => ['pdf', 'djvu'].includes(b.format));
    } else if (activeFilter === 'text') {
      result = result.filter((b) => ['md', 'txt', 'fb2', 'mobi', 'azw3'].includes(b.format));
    }

    // 3. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return (b.importedAt || 0) - (a.importedAt || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'progress':
          return (b.progress?.percent || 0) - (a.progress?.percent || 0);
        case 'size':
          return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [books, searchQuery, activeFilter, sortBy]);

  return (
    <LibraryDropzone onFilesDropped={handleFilesDropped}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Toolbar with Categories, Sort, and View Mode (Only shown when books exist) */}
        {books.length > 0 && (
          <LibraryToolbar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={books.length}
            filteredCount={filteredAndSortedBooks.length}
            onOpenFile={onOpenFile || (() => {})}
            onOpenStats={onOpenStats}
          />
        )}

        {/* Content Area */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Loading library catalog...
          </div>
        ) : books.length === 0 ? (
          <LibraryEmptyState onOpenFile={onOpenFile} />
        ) : filteredAndSortedBooks.length === 0 ? (
          <LibraryEmptyState isSearchEmpty searchQuery={searchQuery} />
        ) : viewMode === 'grid' ? (
          /* Grid View Mode */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            {filteredAndSortedBooks.map((book) => (
              <LibraryBookCard
                key={book.id}
                book={book}
                onOpenBook={onOpenBook || (() => {})}
                onShowInfo={setInfoModalBook}
                onDeleteBook={setDeleteModalBook}
              />
            ))}
          </div>
        ) : (
          /* List View Mode */
          <LibraryListView
            books={filteredAndSortedBooks}
            onOpenBook={onOpenBook || (() => {})}
            onShowInfo={setInfoModalBook}
            onDeleteBook={setDeleteModalBook}
          />
        )}

        {/* Modals */}
        <BookInfoModal
          book={infoModalBook}
          onClose={() => setInfoModalBook(null)}
          onOpenBook={onOpenBook || (() => {})}
          onDeleteBook={setDeleteModalBook}
        />

        <DeleteConfirmModal
          book={deleteModalBook}
          onCancel={() => setDeleteModalBook(null)}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </LibraryDropzone>
  );
};
