import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAppData } from "../services/AppDataContext";
import { instantiateTemplate, templates } from "../utils/templates";

export default function Templates() {
  const { savePreset } = useAppData();
  const navigate = useNavigate();

  const useTemplate = async (index: number) => {
    const saved = await savePreset(instantiateTemplate(templates[index]));
    navigate(`/preset/${saved.id}`);
  };

  return (
    <div className="mx-auto max-w-[1300px] p-8 lg:p-10">
      <PageHeader eyebrow="Quick start" title="Preset templates" description="Start with a practical sequence, then fill in the paths and apps that are specific to your PC." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template, index) => (
          <article className="panel flex min-h-64 flex-col p-5" key={template.id}>
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent-500/10 text-2xl">{template.icon}</div>
              <Sparkles size={18} className="text-accent-400" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">{template.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{template.description}</p>
            <div className="mt-4 text-xs text-zinc-500">{template.actions.length} actions included</div>
            <button className="btn-primary mt-auto w-full" onClick={() => void useTemplate(index)}>Use template <ArrowRight size={16} /></button>
          </article>
        ))}
      </div>
    </div>
  );
}
