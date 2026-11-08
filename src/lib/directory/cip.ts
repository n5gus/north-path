/**
 * Two-digit series titles as printed on the NCES CIP 2020 crosswalk
 * (https://nces.ed.gov/ipeds/cipcode/crosswalk.aspx?y=56), checked 2026-11-07.
 * A code that is absent from this list is not given a guessed field name.
 */
export const CIP_2020_SERIES: Record<string, string> = {
  "01": "Agriculture, Agriculture Operations, and Related Sciences",
  "04": "Architecture and Related Services",
  "10": "Communications Technologies/Technicians and Support Services",
  "11": "Computer and Information Sciences and Support Services",
  "12": "Personal and Culinary Services",
  "13": "Education",
  "15": "Engineering Technologies and Engineering-Related Fields",
  "19": "Family and Consumer Sciences/Human Sciences",
  "22": "Legal Professions and Studies",
  "24": "Liberal Arts and Sciences, General Studies and Humanities",
  "26": "Biological and Biomedical Sciences",
  "30": "Multi/Interdisciplinary Studies",
  "31": "Parks, Recreation, Leisure, and Fitness Studies",
  "41": "Science Technologies/Technicians",
  "43": "Homeland Security, Law Enforcement, Firefighting and Related Protective Services",
  "45": "Social Sciences",
  "47": "Mechanic and Repair Technologies/Technicians",
  "49": "Transportation and Materials Moving",
  "50": "Visual and Performing Arts",
  "51": "Health Professions and Related Programs",
  "52": "Business, Management, Marketing, and Related Support Services",
};

export function cipSeries(cip6: string | null | undefined): { code: string; title: string } | null {
  if (!cip6) return null;
  const code = cip6.slice(0, 2);
  if (!/^\d{2}$/.test(code)) return null;
  const title = CIP_2020_SERIES[code];
  if (!title) return null;
  return { code, title };
}
