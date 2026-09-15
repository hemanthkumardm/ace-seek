# OpenROAD Studio — Compare runs & Measured DSE

## Compare two runs

1. Studio → **Compare & DSE**
2. Pick Job A and Job B from recent jobs
3. **Compare** → WNS/area/power deltas + short log diff

API: `POST /api/openroad/compare` `{ jobA, jobB }`  
List: `GET /api/openroad/job-history`

## Measured DSE (not Ace-Matrix model)

1. **Launch measured DSE** → three container jobs until **placement** at densities 0.45 / 0.55 / 0.65  
2. Panel polls until jobs finish  
3. **Measured Pareto frontier** from extracted metrics (WNS ↑, power ↓, area ↓)

API: `POST /api/openroad/dse` · `GET /api/openroad/dse?dseId=`

Requires Max (`openroad_run`). Each variant uses `ACE_FORCE_FRESH=1` so runs do not clobber each other.
