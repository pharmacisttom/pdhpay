# TOMVIS blueprint
TOMVIS is a family of commercial applications. TOMVIS Core is its independently maintained foundation: identity, organizations, authorization, audit, settings and API conventions. Core owns no attendance, payroll, healthcare, finance, billing or AI behavior.

Future products compose Core and implement product modules under their own boundaries. Product code may depend on public Core services; Core must not import product modules. Maintain Core independently and integrate through reviewed versions. Licensing, if added, must use transparent signed claims and documented grace/recovery behavior; no invasive DRM or customer lockouts.

Foundation 0.1 contains ten platform capabilities and a basic administration shell. Production rollout requires environment provisioning, database integration validation, reset delivery wiring, backup restoration rehearsal and security review.
