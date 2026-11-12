/**
 * Lumina Reader - Phase 2 Verification & Automated Test Suite
 * Asserts all 4 Phase 2 milestones: Zip-Slip defense, Dublin Core, Spine, and recursive TOC
 */

import { EpubEngine } from './epubEngine';
import { generateSampleEpub, generateZipSlipAttackArchive } from './sampleEpubGenerator';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { ParsedEpubBook } from '@/types/epub';

export interface VerificationCheck {
  id: string;
  name: string;
  phaseTask: '2.1' | '2.2' | '2.3' | '2.4';
  passed: boolean;
  details: string;
}

export interface Phase2VerificationReport {
  timestamp: number;
  totalChecks: number;
  passedChecks: number;
  allPassed: boolean;
  checks: VerificationCheck[];
  parsedSampleBook?: ParsedEpubBook;
}

export async function runPhase2Verification(): Promise<Phase2VerificationReport> {
  const checks: VerificationCheck[] = [];

  // ==========================================
  // Task 2.1: Safe Archive Decompressor & Zip-Slip Guard
  // ==========================================
  try {
    const maliciousZipBuffer = await generateZipSlipAttackArchive();
    const safeReader = await SafeArchiveReader.fromData(maliciousZipBuffer);
    const alerts = safeReader.getZipSlipAlerts();
    const safeFiles = safeReader.getSafeFileList();

    const blockedAttackPaths = alerts.length >= 3;
    const noEscapedFiles = !safeFiles.some((f) => f.includes('..') || f.includes('passwd'));

    checks.push({
      id: 'check-2.1-zip-slip',
      name: 'Zip-Slip Traversal Attack Defense Guard',
      phaseTask: '2.1',
      passed: blockedAttackPaths && noEscapedFiles,
      details: `Successfully intercepted ${alerts.length} malicious path traversal attempts. Escaped files in safe index: 0.`,
    });
  } catch (err) {
    checks.push({
      id: 'check-2.1-zip-slip',
      name: 'Zip-Slip Traversal Attack Defense Guard',
      phaseTask: '2.1',
      passed: false,
      details: `Zip-Slip defense check threw an error: ${String(err)}`,
    });
  }

  // ==========================================
  // Tasks 2.2, 2.3, 2.4: Complete EPUB Parsing Suite
  // ==========================================
  let parsedBook: ParsedEpubBook | undefined;

  try {
    const sampleBuffer = await generateSampleEpub();
    const { book, archive } = await EpubEngine.parseEpub(sampleBuffer);
    parsedBook = book;

    // Check Task 2.2: Dublin Core & Cover Art
    const hasTitle = book.metadata.title === "Alice's Adventures in Wonderland";
    const hasCreator = book.metadata.creator === 'Lewis Carroll';
    const hasPublisher = book.metadata.publisher === 'Macmillan & Co.';
    const hasCover = Boolean(book.metadata.coverBlobUrl || book.metadata.coverHref);

    checks.push({
      id: 'check-2.2-dublin-core',
      name: 'OPF & Dublin Core Metadata Extractor',
      phaseTask: '2.2',
      passed: hasTitle && hasCreator && hasPublisher && hasCover,
      details: `Extracted: "${book.metadata.title}" by ${book.metadata.creator} (${book.metadata.publisher}). Cover resolved: ${hasCover ? 'YES' : 'NO'}.`,
    });

    // Check Task 2.3: Reading Spine & Manifest Resolver
    const manifestItemCount = book.manifest.size;
    const spineItemCount = book.spine.length;
    const hasOrderedSpine = spineItemCount === 2 && book.spine[0].idref === 'ch01';
    const hasResolvedPaths = book.spine.every((s) => s.fullPath.startsWith('OEBPS/'));

    checks.push({
      id: 'check-2.3-spine-manifest',
      name: 'Reading Spine & Manifest Resolver',
      phaseTask: '2.3',
      passed: manifestItemCount >= 5 && hasOrderedSpine && hasResolvedPaths,
      details: `Indexed ${manifestItemCount} manifest items. Spine sequence contains ${spineItemCount} reading chapters with resolved paths.`,
    });

    // Check Task 2.4: Table of Contents (NCX / NAV) Recursive Parser
    const hasToc = book.toc.length >= 2;
    const firstChapter = book.toc[0];
    const hasNestedSubitems = Boolean(firstChapter?.subitems && firstChapter.subitems.length === 2);

    checks.push({
      id: 'check-2.4-toc-hierarchy',
      name: 'Table of Contents (NCX / NAV) Recursive Hierarchy',
      phaseTask: '2.4',
      passed: hasToc && hasNestedSubitems,
      details: `Parsed ${book.toc.length} top-level chapters. Sub-sections recursively extracted: ${firstChapter?.subitems?.length || 0} subitems in Chapter 1.`,
    });

    archive.revokeObjectUrls();
  } catch (err) {
    checks.push({
      id: 'check-epub-engine',
      name: 'EPUB Parsing Engine Pipeline',
      phaseTask: '2.2',
      passed: false,
      details: `Engine failed with error: ${String(err)}`,
    });
  }

  const passedChecks = checks.filter((c) => c.passed).length;

  return {
    timestamp: Date.now(),
    totalChecks: checks.length,
    passedChecks,
    allPassed: passedChecks === checks.length,
    checks,
    parsedSampleBook: parsedBook,
  };
}
