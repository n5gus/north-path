export const CHECKED_ON = "November 7, 2026";

export interface SourceRef {
  label: string;
  url: string;
  checked: string;
}

export function source(label: string, url: string): SourceRef {
  return { label, url, checked: CHECKED_ON };
}

export const sources = {
  asPage: source(
    "MDC: Cybersecurity Associate in Science",
    "https://www.mdc.edu/cybersecurityas/",
  ),
  bsPage: source(
    "MDC: Cybersecurity Bachelor of Science",
    "https://www.mdc.edu/cybersecuritybs/",
  ),
  bsAdmit: source(
    "MDC: BS Cybersecurity admission requirements",
    "https://www.mdc.edu/cybersecuritybs/admission-requirements.aspx",
  ),
  bsCourses: source(
    "MDC: BS Cybersecurity courses",
    "https://www.mdc.edu/cybersecuritybs/courses.aspx",
  ),
  degreePrograms: source(
    "MDC: Cybersecurity degree programs",
    "https://www.mdc.edu/cybersecurity/degree-programs/",
  ),
  analystPage: source(
    "MDC: Cybersecurity Analyst College Credit Certificate",
    "https://www.mdc.edu/cybersecurity-analyst/",
  ),
  cccGuide: source(
    "MDC course sequence guide: Cybersecurity Analyst CCC 66061 (effective Fall 2023)",
    "https://www.mdc.edu/academics/programs/csg/CCC_CybersecurityAnalyst_csg.pdf",
  ),
  cccSheet: source(
    "MDC program sheet: Cybersecurity Analyst CCC 66061 (effective Fall 2023)",
    "https://www.mdc.edu/academics/programs/ps/66061.pdf",
  ),
  asGuide: source(
    "MDC full-time course sequence guide: AS Cybersecurity 25079 (effective Spring 2025)",
    "https://www.mdc.edu/academics/programs/csg/AS_Cybersecurity_csg.pdf",
  ),
  asSheet: source(
    "MDC program sheet: AS Cybersecurity 25079 (effective Spring 2025)",
    "https://www.mdc.edu/academics/programs/ps/25079.pdf",
  ),
  bsSheet: source(
    "MDC program sheet: BS Cybersecurity S9515 (effective Spring 2025)",
    "https://www.mdc.edu/academics/programs/ps/S9515.pdf",
  ),
  exploreNorth: source(
    "MDC: Explore North Campus",
    "https://www.mdc.edu/exploreNorth/",
  ),
  northOffice: source(
    "MDC: North Campus administration address",
    "https://www.mdc.edu/north/administrative-services/",
  ),
  northDirections: source(
    "MDC: North Campus directions",
    "https://www.mdc.edu/college_wide/campus_finder/Pages/north.asp",
  ),
  admissions: source(
    "MDC: Admissions info",
    "https://www3.mdc.edu/admissions-info/",
  ),
  procedure4000: source(
    "MDC Procedure 4000: Admission criteria and guidelines",
    "https://www.mdc.edu/procedures/chapter4/4000.pdf",
  ),
  placement: source(
    "MDC: Placement criteria for degree and college credit certificate programs",
    "https://www.mdc.edu/aet/placement-criteria/degree-and-college-credit-certificate-programs/",
  ),
  inventory: source(
    "MDC academic program inventory",
    "https://www.mdc.edu/academics/documents/academic-programs-cip.pdf",
  ),
  catalog: source(
    "MDC college catalog (2026–2028 catalog page)",
    "https://www.mdc.edu/catalog/",
  ),
  entec: source(
    "MDC School of Engineering and Technology programs",
    "https://www.mdc.edu/entec/programs.aspx",
  ),
};
