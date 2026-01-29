import React from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/hooks/useLanguage";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
}

const BASE_URL = "https://chipgames.github.io/ChipBlockCrush/";

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  url = BASE_URL,
}) => {
  const { t, language } = useLanguage();
  const finalTitle = title ?? t("seo.title");
  const finalDescription = description ?? t("seo.description");
  const finalKeywords = keywords ?? t("seo.keywords");
  const langParam = language !== "ko" ? `?lang=${language}` : "";

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url + langParam} />
      <link rel="canonical" href={url + langParam} />
    </Helmet>
  );
};

export default SEOHead;
