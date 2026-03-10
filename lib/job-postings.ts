export type ScrapedJobPosting = {
  title: string;
  company: string;
  location?: string;
  url: string;
  source: string;
  snippet?: string;
  postedAt?: string;
  externalId: string;
};

type SourceMeta = {
  sourceTitle?: string;
  defaultCompany?: string;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function normalizeUrl(value: string) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function normalizeDate(value?: string) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

function safeString(value: unknown) {
  return typeof value === "string" ? normalizeWhitespace(value) : "";
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function extractSourceMeta(html: string, sourceUrl: string): SourceMeta {
  const siteNameMatch = html.match(
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
  );
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const sourceTitle = normalizeWhitespace(
    (siteNameMatch?.[1] ?? titleMatch?.[1] ?? "").replace(/<[^>]+>/g, " "),
  );

  let defaultCompany = "";
  try {
    const parsed = new URL(sourceUrl);
    const hostParts = parsed.hostname.split(".");
    const domainCore = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : hostParts[0];
    const pathFirst = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    if (pathFirst && !["jobs", "job", "careers", "positions", "openings"].includes(pathFirst)) {
      defaultCompany = titleCase(pathFirst);
    } else if (domainCore) {
      defaultCompany = titleCase(domainCore);
    }
  } catch {
    defaultCompany = "";
  }

  if (
    sourceTitle &&
    sourceTitle.length < 80 &&
    !/jobs|careers|open positions|hiring/i.test(sourceTitle)
  ) {
    defaultCompany = sourceTitle;
  }

  return {
    sourceTitle: sourceTitle || undefined,
    defaultCompany: defaultCompany || undefined,
  };
}

function collectJobPostingNodes(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== "object") {
    return [];
  }
  const node = value as Record<string, unknown>;
  const type = node["@type"];
  const typeList = Array.isArray(type) ? type : [type];
  const isJobPosting = typeList.some(
    (item) => typeof item === "string" && item.toLowerCase() === "jobposting",
  );
  if (isJobPosting) {
    return [node];
  }
  const graph = node["@graph"];
  if (Array.isArray(graph)) {
    return graph.flatMap((entry) => collectJobPostingNodes(entry));
  }
  return [];
}

function parseJsonLdJobPostings(
  html: string,
  sourceUrl: string,
  sourceMeta: SourceMeta,
): ScrapedJobPosting[] {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const postings: ScrapedJobPosting[] = [];

  for (const match of scripts) {
    const payload = safeJsonParse(match[1] ?? "");
    if (!payload) {
      continue;
    }

    const nodes = Array.isArray(payload)
      ? payload.flatMap((item) => collectJobPostingNodes(item))
      : collectJobPostingNodes(payload);

    for (const node of nodes) {
      const title = typeof node.title === "string" ? normalizeWhitespace(node.title) : "";
      const url =
        typeof node.url === "string"
          ? toAbsoluteUrl(node.url, sourceUrl)
          : sourceUrl;
      const description =
        typeof node.description === "string"
          ? normalizeWhitespace(node.description.replace(/<[^>]+>/g, " "))
          : "";

      const hiringOrg = node.hiringOrganization as
        | Record<string, unknown>
        | Record<string, unknown>[]
        | undefined;
      const companyName = Array.isArray(hiringOrg)
        ? typeof hiringOrg[0]?.name === "string"
          ? hiringOrg[0].name
          : ""
        : typeof hiringOrg?.name === "string"
          ? hiringOrg.name
          : "";

      const locationValue = node.jobLocation as
        | Record<string, unknown>
        | Record<string, unknown>[]
        | undefined;
      const firstLocation = Array.isArray(locationValue) ? locationValue[0] : locationValue;
      const address = firstLocation?.address as Record<string, unknown> | undefined;
      const location = [
        typeof address?.addressLocality === "string" ? address.addressLocality : "",
        typeof address?.addressRegion === "string" ? address.addressRegion : "",
        typeof address?.addressCountry === "string" ? address.addressCountry : "",
      ]
        .filter(Boolean)
        .join(", ");

      if (!title) {
        continue;
      }

      postings.push({
        title,
        company: normalizeWhitespace(companyName || sourceMeta.defaultCompany || "Unknown company"),
        location: location || undefined,
        url,
        source: sourceUrl,
        snippet: description.slice(0, 300) || undefined,
        postedAt: normalizeDate(
          typeof node.datePosted === "string" ? node.datePosted : undefined,
        ),
        externalId: `${sourceUrl}::${title.toLowerCase()}::${url.toLowerCase()}`,
      });
    }
  }

  return postings;
}

function parseAnchorJobPostings(
  html: string,
  sourceUrl: string,
  sourceMeta: SourceMeta,
): ScrapedJobPosting[] {
  const postings: ScrapedJobPosting[] = [];
  const seen = new Set<string>();
  const keywordPattern =
    /(engineer|developer|manager|designer|analyst|architect|scientist|intern|product|data|software)/i;
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1] ?? "";
    const text = normalizeWhitespace((match[2] ?? "").replace(/<[^>]+>/g, " "));
    if (!href || !text || text.length < 6 || text.length > 140) {
      continue;
    }
    if (!keywordPattern.test(text)) {
      continue;
    }
    const absoluteUrl = toAbsoluteUrl(href, sourceUrl);
    if (!looksLikeJobDetailUrl(absoluteUrl, sourceUrl)) {
      continue;
    }
    const key = `${text.toLowerCase()}::${absoluteUrl.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    postings.push({
      title: text,
      company: sourceMeta.defaultCompany || "Unknown company",
      url: absoluteUrl,
      source: sourceUrl,
      externalId: `${sourceUrl}::${key}`,
    });
    if (postings.length >= 60) {
      break;
    }
  }

  return postings;
}

export function getJobSourceUrls() {
  const raw = process.env.JOB_SOURCE_URLS ?? "";
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((url) => !/greenhouse\.io/i.test(url));
}

function getLeverCompanies() {
  const raw = process.env.LEVER_COMPANIES ?? "";
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getArbeitnowPages() {
  const parsed = Number(process.env.ARBEITNOW_MAX_PAGES ?? "8");
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 8;
  }
  return Math.min(parsed, 30);
}

async function fetchLeverPostings() {
  const companies = getLeverCompanies();
  const postings: ScrapedJobPosting[] = [];
  const failures: { source: string; message: string }[] = [];

  for (const company of companies) {
    const source = `lever:${company}`;
    try {
      const response = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as Array<Record<string, unknown>>;
      payload.forEach((row) => {
        const title = safeString(row.text);
        const url = safeString(row.hostedUrl);
        const location = safeString((row.categories as Record<string, unknown> | undefined)?.location);
        const createdAt = typeof row.createdAt === "number" ? new Date(row.createdAt).toISOString() : undefined;
        if (!title || !url) {
          return;
        }
        postings.push({
          title,
          company: titleCase(company),
          location: location || undefined,
          url,
          source,
          postedAt: createdAt,
          snippet: safeString((row.descriptionPlain as string | undefined) ?? (row.description as string | undefined)).slice(0, 300) || undefined,
          externalId: `${source}::${safeString(row.id) || `${title}::${url}`}`,
        });
      });
    } catch (error) {
      failures.push({
        source,
        message: error instanceof Error ? error.message : "Unknown scrape error",
      });
    }
  }

  return { postings, failures };
}

async function fetchArbeitnowPostings() {
  const maxPages = getArbeitnowPages();
  const postings: ScrapedJobPosting[] = [];
  const failures: { source: string; message: string }[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const source = `arbeitnow:page:${page}`;
    try {
      const response = await fetch(
        `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
        { headers: { Accept: "application/json" }, cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as {
        data?: Array<Record<string, unknown>>;
      };
      const rows = payload.data ?? [];
      if (rows.length === 0) {
        break;
      }
      rows.forEach((row) => {
        const title = safeString(row.title);
        const company = safeString(row.company_name);
        const url = safeString(row.url);
        const location = safeString(row.location);
        const description = safeString(row.description);
        const postedAt = normalizeDate(safeString(row.created_at));
        if (!title || !url) {
          return;
        }
        postings.push({
          title,
          company: company || "Unknown company",
          location: location || undefined,
          url,
          source: "arbeitnow",
          postedAt,
          snippet: description.slice(0, 300) || undefined,
          externalId: `arbeitnow::${safeString(row.slug) || `${title}::${url}`}`,
        });
      });
    } catch (error) {
      failures.push({
        source,
        message: error instanceof Error ? error.message : "Unknown scrape error",
      });
    }
  }

  return { postings, failures };
}

async function fetchRemoteOkPostings() {
  const source = "remoteok";
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = (await response.json()) as Array<Record<string, unknown>>;
    const postings: ScrapedJobPosting[] = [];
    payload.forEach((row) => {
      const title = safeString(row.position);
      const company = safeString(row.company);
      const id = String(row.id ?? "");
      const link = safeString(row.url) || (id ? `https://remoteok.com/remote-jobs/${id}` : "");
      const location = safeString(row.location);
      const description = safeString(row.description);
      const epoch = typeof row.epoch === "number" ? new Date(row.epoch * 1000).toISOString() : undefined;
      if (!title || !link) {
        return;
      }
      postings.push({
        title,
        company: company || "Unknown company",
        location: location || "Remote",
        url: link.startsWith("http") ? link : `https://remoteok.com${link}`,
        source,
        postedAt: epoch,
        snippet: description.slice(0, 300) || undefined,
        externalId: `remoteok::${id || `${title}::${link}`}`,
      });
    });
    return { postings, failures: [] as { source: string; message: string }[] };
  } catch (error) {
    return {
      postings: [] as ScrapedJobPosting[],
      failures: [
        {
          source,
          message: error instanceof Error ? error.message : "Unknown scrape error",
        },
      ],
    };
  }
}

export async function scrapeJobSources(urls: string[]) {
  const all: ScrapedJobPosting[] = [];
  const failures: { source: string; message: string }[] = [];

  for (const sourceUrl of urls) {
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          "User-Agent": "HireGroundBot/1.0 (+local dev)",
          Accept: "text/html,application/xhtml+xml",
        },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();
      const sourceMeta = extractSourceMeta(html, sourceUrl);
      const fromJsonLd = parseJsonLdJobPostings(html, sourceUrl, sourceMeta);
      const fromAnchors = parseAnchorJobPostings(html, sourceUrl, sourceMeta);
      const byId = new Map<string, ScrapedJobPosting>();
      [...fromJsonLd, ...fromAnchors].forEach((posting) => {
        if (!byId.has(posting.externalId)) {
          byId.set(posting.externalId, posting);
        }
      });
      all.push(...byId.values());
    } catch (error) {
      failures.push({
        source: sourceUrl,
        message: error instanceof Error ? error.message : "Unknown scrape error",
      });
    }
  }

  const [lever, arbeitnow, remoteok] = await Promise.all([
    fetchLeverPostings(),
    fetchArbeitnowPostings(),
    fetchRemoteOkPostings(),
  ]);

  all.push(...lever.postings, ...arbeitnow.postings, ...remoteok.postings);
  failures.push(...lever.failures, ...arbeitnow.failures, ...remoteok.failures);

  const byExternalId = new Map<string, ScrapedJobPosting>();
  all.forEach((posting) => {
    if (!byExternalId.has(posting.externalId)) {
      byExternalId.set(posting.externalId, posting);
    }
  });

  return { postings: [...byExternalId.values()], failures };
}

function looksLikeJobDetailUrl(url: string, sourceUrl: string) {
  let candidate: URL;
  let source: URL;
  try {
    candidate = new URL(url);
    source = new URL(sourceUrl);
  } catch {
    return false;
  }

  const normalizedCandidate = normalizeUrl(candidate.toString());
  const normalizedSource = normalizeUrl(source.toString());
  if (normalizedCandidate === normalizedSource) {
    return false;
  }

  const path = candidate.pathname.toLowerCase();
  const noisyPaths = [
    "/jobs",
    "/jobs/",
    "/careers",
    "/careers/",
    "/open-positions",
    "/positions",
  ];
  if (noisyPaths.includes(path)) {
    return false;
  }

  const detailPattern =
    /(\/jobs\/[a-z0-9-]{4,}|\/position\/[a-z0-9-]{4,}|\/job\/[a-z0-9-]{4,}|\/roles?\/[a-z0-9-]{4,}|ashby|lever\.co\/[^/]+\/[a-z0-9-]{4,}|remoteok\.com\/remote-jobs)/i;
  return detailPattern.test(
    `${candidate.hostname}${candidate.pathname}${candidate.search}`.toLowerCase(),
  );
}

function looksLikeApplyPage(html: string) {
  const text = html.toLowerCase();
  const signals = [
    "apply now",
    "submit application",
    "application form",
    "start application",
    "apply for this job",
    "job application",
  ];
  return (
    signals.some((signal) => text.includes(signal)) ||
    /lever|ashby|greenhouse|workday/.test(text)
  );
}

async function isPostingUrlReachable(url: string, sourceUrl: string) {
  if (/greenhouse\.io/i.test(url) || /greenhouse\.io/i.test(sourceUrl)) {
    return false;
  }
  if (!looksLikeJobDetailUrl(url, sourceUrl)) {
    return false;
  }
  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "HireGroundBot/1.0 (+local dev)" },
      cache: "no-store",
    });
    if (headResponse.ok) {
      const getResponse = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "HireGroundBot/1.0 (+local dev)" },
        cache: "no-store",
      });
      if (!getResponse.ok) {
        return false;
      }
      const finalUrl = getResponse.url || url;
      if (/greenhouse\.io/i.test(finalUrl)) {
        return false;
      }
      const html = await getResponse.text();
      return looksLikeApplyPage(html);
    }
    if ([403, 405, 406].includes(headResponse.status)) {
      const getResponse = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "HireGroundBot/1.0 (+local dev)" },
        cache: "no-store",
      });
      if (!getResponse.ok) {
        return false;
      }
      const finalUrl = getResponse.url || url;
      if (/greenhouse\.io/i.test(finalUrl)) {
        return false;
      }
      const html = await getResponse.text();
      return looksLikeApplyPage(html);
    }
    return false;
  } catch {
    return false;
  }
}

export async function validateScrapedPostings(postings: ScrapedJobPosting[]) {
  const reachable: ScrapedJobPosting[] = [];
  const failures: { source: string; message: string }[] = [];
  const uniqueByUrl = new Set<string>();

  for (const posting of postings) {
    const normalizedUrl = posting.url.trim();
    if (/greenhouse\.io/i.test(normalizedUrl) || /greenhouse\.io/i.test(posting.source)) {
      failures.push({
        source: normalizedUrl || posting.source,
        message: "Greenhouse links are explicitly blocked",
      });
      continue;
    }
    if (!normalizedUrl || uniqueByUrl.has(normalizedUrl)) {
      continue;
    }
    uniqueByUrl.add(normalizedUrl);
    const ok = await isPostingUrlReachable(normalizedUrl, posting.source);
    if (ok) {
      reachable.push(posting);
    } else {
      failures.push({
        source: normalizedUrl,
        message: "Unreachable or returned non-2xx status",
      });
    }
  }

  return { postings: reachable, failures };
}
