import { IsNotEmpty, IsString } from "class-validator";

export class CreateQuestionDto {
   @IsNotEmpty()
   @IsString()
   public readonly text: string
}
