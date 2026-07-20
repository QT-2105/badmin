# Information Architecture

## Recommended Existing-Capability Grouping

1. **General / Club**
   - Club name.
   - Club logo.
   - Clearly indicate this is persisted server-side.

2. **Schedule & Session**
   - Max court count per session.
   - Clearly indicate it affects create/edit session UI.

3. **Finance Automation**
   - Auto court fee voucher.
   - Auto shuttle usage voucher.
   - Clearly indicate these are local browser preferences passed during session completion.

4. **Maintenance**
   - Reset match history.
   - Delete player images.
   - Visually separate danger/destructive actions.

5. **System Information / Read-Only**
   - Optional future read-only section for environment-backed storage readiness.
   - No editable controls unless backend exists.

## Missing Capability Handling

Do not render fake sections for notifications, backup, security settings, feature flags, or export/import during implementation. If mentioned, document them as future scope only.

