# Alpha.3 evidence archive

These are unmodified JSON reports/manifests and screenshots from the verified `ec1bb62709f9c392b5ddf52549cbe004890b26e7` candidate builds. Original installer payloads, notices, SBOM and complete bundle checksums are in `release/` or `release/candidates/` in the delivery checkout and the linked Actions run. This archive preserves evidence; it is not an installable distribution or a complete replacement for those bundles.

The [unpublished release draft](https://github.com/microyee-ai/zettel/releases/tag/untagged-3f1117c7a28602f5d313) also retains the six selected installers and a `desktop-evidence.zip` with these reports, notices and SBOMs. Access to that draft requires repository release permissions. Its aggregate manifest and checksums use GitHub's normalized Windows download name; the original reports retain the candidate filename.

- `local-macos-arm64/`: local DMG/ZIP, independent alpha.2 upgrade/fresh restore, and publisher-trust assessment.
- `ci-macos-arm64/`: GitHub macos-15 arm64 candidate reports.
- `ci-macos-x64/`: GitHub macos-15-intel candidate reports.
- `ci-windows-x64/`: GitHub windows-2025 NSIS install/runtime/uninstall report.
- `ci-linux-x64/`: GitHub ubuntu-24.04 AppImage extraction/runtime report with scoped sandbox helper.

Each manifest preserves the original relative report/screenshot paths and exact artifact hashes. Absolute paths inside reports identify disposable test installations that were removed, not download destinations. Read each report's `unverified` list and the [release record](../../0.1.0-alpha.3.md) before making availability claims. The local and CI arm64 artifacts have different hashes despite sharing source; do not mix their reports with the other build's bytes.

The separate [release-upload.json](release-upload.json) was created after the final uploads. It records the nine remote asset sizes/digests and unpublished draft state, checked against local files. It is outside the uploaded archive to avoid a circular archive checksum.
