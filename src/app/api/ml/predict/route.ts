import { NextRequest, NextResponse } from "next/server";
import { SentinalXNerMlModel } from "@/lib/ml/model";
import { MlPredictionRequest } from "@/types/landslide";

export async function POST(req: NextRequest) {
  try {
    const body: MlPredictionRequest = await req.json();

    if (body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Latitude and longitude coordinates are required for ML inference.",
        },
        { status: 400 }
      );
    }

    const prediction = SentinalXNerMlModel.predict(body);

    return NextResponse.json({
      success: true,
      result: prediction,
    });
  } catch (err: unknown) {
    console.error("[API /api/ml/predict] Error executing prediction:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute ML landslide inference",
      },
      { status: 500 }
    );
  }
}
