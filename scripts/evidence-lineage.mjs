export function listOnlyGeneratedFiles(entries, generatedDocs) {
  const normalized = entries
    .map((entry) => entry.trim())
    .filter(Boolean);

  return (
    normalized.length > 0 &&
    normalized.every((entry) =>
      generatedDocs.some((generatedDoc) => entry.endsWith(generatedDoc)),
    )
  );
}

export function resolveEvidenceSourceCandidates({
  head,
  parentsOf,
  changedFilesOf,
  generatedDocs,
}) {
  const candidates = [];
  const add = (commit) => {
    if (commit && !candidates.includes(commit)) candidates.push(commit);
  };
  const addGeneratedCommitLineage = (commit) => {
    if (
      !commit ||
      !listOnlyGeneratedFiles(changedFilesOf(commit), generatedDocs)
    ) {
      return;
    }

    add(commit);
    add(parentsOf(commit)[0]);
  };

  add(head);
  const headParents = parentsOf(head);

  if (headParents.length > 1) {
    for (const parent of headParents) addGeneratedCommitLineage(parent);
  } else if (listOnlyGeneratedFiles(changedFilesOf(head), generatedDocs)) {
    add(headParents[0]);
  }

  return candidates;
}
