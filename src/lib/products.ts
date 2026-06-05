import purposeChicken from "@/assets/purpose-chicken.jpg";
import purposeSoup from "@/assets/purpose-soup.jpg";
import purposeBbq from "@/assets/purpose-bbq.jpg";
import purposeBaking from "@/assets/purpose-baking.jpg";
import purposeTea from "@/assets/purpose-tea.jpg";

export type Category = "clean" | "blend" | "tea" | "gift" | "other";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
  description: string;
  image: string;
  category: Category;
  categoryTitle?: string | null;
  price: number;
  weight?: string | null;
  packLabel?: string | null;
  tags: string[];
  badge?: string | null;
  visible: boolean;
  quantity: number;
  stockStatus: StockStatus;
}

export interface CategoryInfo {
  id: Category;
  title: string;
  subtitle: string;
}

export const categories: CategoryInfo[] = [
  { id: "clean", title: "Чисті спеції", subtitle: "Один компонент. Чистий смак." },
  { id: "blend", title: "Суміші", subtitle: "Авторські купажі від шефа." },
  { id: "tea", title: "Чаї", subtitle: "Купажі для ритуалу." },
  { id: "gift", title: "Подарункові набори", subtitle: "Готові подарунки в дерев'яних коробках." },
];

export const purposes = [
  { id: "курка", title: "Для курки", image: purposeChicken },
  { id: "суп", title: "Для супу", image: purposeSoup },
  { id: "гриль", title: "Для гриля", image: purposeBbq },
  { id: "випічка", title: "Для випічки", image: purposeBaking },
  { id: "чай", title: "Для чаю та ритуалів", image: purposeTea },
] as const;

export const placeholderImage = "/placeholder.svg";
