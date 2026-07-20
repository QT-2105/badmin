# Current Audit

`NextMatchQueue` and `NextMatchCard` use protected suggestion/apply/replace/lock store actions. Replacement UI owns draft-only local state before save.
