export interface StreamingProvider {
  id: number;
  name: string;
  logo_path: string;
}

export const STREAMING_PROVIDERS: StreamingProvider[] = [
  { id: 8, name: "Netflix", logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg" },
  {
    id: 9,
    name: "Amazon Prime Video",
    logo_path: "/emthp39XA2YScoYL1p0sdbAH2WA.jpg",
  },
  {
    id: 337,
    name: "Disney Plus",
    logo_path: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg",
  },
  {
    id: 384,
    name: "HBO Max",
    logo_path: "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg",
  },
  { id: 350, name: "Apple TV Plus", logo_path: "/6uhKBfmtzFqOcLousHwZuzcrScK.jpg" },
  { id: 15, name: "Hulu", logo_path: "/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg" },
  {
    id: 531,
    name: "Paramount Plus",
    logo_path: "/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg",
  },
  { id: 283, name: "Crunchyroll", logo_path: "/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg" },
  { id: 203, name: "Max", logo_path: "/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg" },
  { id: 1899, name: "Max Amazon Channel", logo_path: "/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg" },
  { id: 2, name: "Apple iTunes", logo_path: "/peURlLlr8jggOwK53fJ5wdQl05y.jpg" },
  { id: 3, name: "Google Play Movies", logo_path: "/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg" },
  { id: 10, name: "Amazon Video", logo_path: "/emthp39XA2YScoYL1p0sdbAH2WA.jpg" },
  { id: 68, name: "Microsoft Store", logo_path: "/shq88b09gTBYC4hA7RZZ0xEoHbJ.jpg" },
  { id: 192, name: "YouTube", logo_path: "/kICQccvOh8AIBMHGkBXJ047xeHN.jpg" },
];

export const PROVIDER_REGIONS = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
];
