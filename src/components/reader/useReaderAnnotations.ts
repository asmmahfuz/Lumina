/**
 * Lumina Reader - Reader Annotations Hook
 * Manages text selection popup, highlight creation, sticky note modal,
 * and chapter jumping/scrolling for annotations.
 */

import { useState, useCallback, useRef } from 'react';
import { Annotation, HighlightColor } from '@/types/book';
import { generateCfi } from '@/services/reader/cfiTracker';
import {
  wrapSelectionRange,
  applyAnnotationsToDocument,
  updateHighlightInDocument,
  removeHighlightFromDocument,
  scrollToHighlightInDocument,
} from '@/services/reader/annotationDomHelper';

export interface SelectionPopupState {
  position: { top: number; left: number };
  text: string;
  range: Range;
}

interface UseReaderAnnotationsProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  bookId?: string;
  currentSpineIndex: number;
  currentSpineId?: string;
  annotations?: Annotation[];
  onSaveAnnotation?: (annotation: Annotation) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  onSetSpineIndex: (index: number) => void;
}

export function useReaderAnnotations({
  iframeRef,
  bookId = 'book',
  currentSpineIndex,
  currentSpineId,
  annotations = [],
  onSaveAnnotation,
  onDeleteAnnotation,
  onSetSpineIndex,
}: UseReaderAnnotationsProps) {
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopupState | null>(null);
  const [activeEditorAnnotation, setActiveEditorAnnotation] = useState<Annotation | null>(null);
  const pendingJumpAnnotationIdRef = useRef<string | null>(null);

  const handleHighlight = useCallback(
    (color: HighlightColor, openNote = false) => {
      if (!selectionPopup) return;
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      if (!doc) return;

      const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const cfi = generateCfi(
        selectionPopup.range.startContainer.parentElement || doc.body,
        currentSpineIndex,
        currentSpineId
      );

      const newAnnotation: Annotation = {
        id,
        bookId,
        spineIndex: currentSpineIndex,
        cfi,
        text: selectionPopup.text,
        color,
        createdAt: Date.now(),
      };

      wrapSelectionRange(doc, selectionPopup.range, newAnnotation, (clicked) => {
        setActiveEditorAnnotation(clicked);
      });

      onSaveAnnotation?.(newAnnotation);
      doc.getSelection()?.removeAllRanges();
      setSelectionPopup(null);

      if (openNote) {
        setActiveEditorAnnotation(newAnnotation);
      }
    },
    [selectionPopup, iframeRef, currentSpineIndex, currentSpineId, bookId, onSaveAnnotation]
  );

  const handleAddNote = useCallback(
    (color: HighlightColor) => {
      handleHighlight(color, true);
    },
    [handleHighlight]
  );

  const handleSaveEditedAnnotation = useCallback(
    (updated: Annotation) => {
      const doc = iframeRef.current?.contentDocument;
      if (doc) updateHighlightInDocument(doc, updated);
      onSaveAnnotation?.(updated);
      setActiveEditorAnnotation(null);
    },
    [iframeRef, onSaveAnnotation]
  );

  const handleDelete = useCallback(
    (annotationId: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (doc) removeHighlightFromDocument(doc, annotationId);
      onDeleteAnnotation?.(annotationId);
      setActiveEditorAnnotation(null);
    },
    [iframeRef, onDeleteAnnotation]
  );

  const handleSelectAnnotationFromSidebar = useCallback(
    (ann: Annotation) => {
      if (ann.spineIndex !== currentSpineIndex) {
        pendingJumpAnnotationIdRef.current = ann.id;
        onSetSpineIndex(ann.spineIndex);
      } else {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
          scrollToHighlightInDocument(doc, ann.id);
        }
      }
    },
    [currentSpineIndex, onSetSpineIndex, iframeRef]
  );

  const attachIframeAnnotationListeners = useCallback(
    (doc: Document) => {
      const handleSelection = () => {
        const sel = doc.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          return;
        }
        const text = sel.toString().trim();
        if (!text) return;

        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const iframe = iframeRef.current;
          const iframeRect = iframe ? iframe.getBoundingClientRect() : { top: 0, left: 0 };

          setSelectionPopup({
            position: {
              top: iframeRect.top + rect.top,
              left: iframeRect.left + rect.left + rect.width / 2,
            },
            text,
            range: range.cloneRange(),
          });
        } catch {
          setSelectionPopup(null);
        }
      };

      const handleSelectionClear = () => {
        const sel = doc.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelectionPopup(null);
        }
      };

      doc.addEventListener('mouseup', handleSelection);
      doc.addEventListener('selectionchange', handleSelectionClear);
    },
    [iframeRef]
  );

  const applyCurrentChapterAnnotations = useCallback(
    (doc: Document) => {
      const chapterAnnotations = annotations.filter((a) => a.spineIndex === currentSpineIndex);
      applyAnnotationsToDocument(doc, chapterAnnotations, (clicked) => {
        setActiveEditorAnnotation(clicked);
      });

      if (pendingJumpAnnotationIdRef.current) {
        const targetId = pendingJumpAnnotationIdRef.current;
        pendingJumpAnnotationIdRef.current = null;
        setTimeout(() => {
          scrollToHighlightInDocument(doc, targetId);
        }, 120);
      }
    },
    [annotations, currentSpineIndex]
  );

  return {
    selectionPopup,
    activeEditorAnnotation,
    handleHighlight,
    handleAddNote,
    handleClosePopup: () => setSelectionPopup(null),
    handleSaveEditedAnnotation,
    handleDeleteAnnotation: handleDelete,
    handleCloseEditor: () => setActiveEditorAnnotation(null),
    handleSelectAnnotationFromSidebar,
    handleEditAnnotationFromSidebar: (ann: Annotation) => setActiveEditorAnnotation(ann),
    attachIframeAnnotationListeners,
    applyCurrentChapterAnnotations,
  };
}
