import { getQuizByPublicId } from "@/app/actions/quiz";
import { Quiz } from "@/components/Quiz";

type Params = Promise<{ publicId: string }>

export default async function SharedQuizPage({
  params,
}: {
  params: Params
}) {
  const { publicId } = await params;
  const quiz = await getQuizByPublicId(publicId);

  return (
    <div className="container mx-auto py-8">
      <Quiz initialQuiz={quiz} standalone />
    </div>
  );
} 