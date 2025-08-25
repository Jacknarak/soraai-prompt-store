// /pages/catalog.js
import SoraAIPromptStore from "../components/SoraAIPromptStore";

export default function CatalogPage() {
  // ส่งโหมด 'catalog' ไปให้คอมโพเนนต์ แสดงกริด + ฟิลเตอร์เต็มรูปแบบ
  return <SoraAIPromptStore mode="catalog" />;
}
