import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Auth = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    // Jika `data` diberikan, ambil property tertentu dari user
    if (data) {
      return req.user?.[data];
    }

    // Jika tidak ada `data`, kembalikan seluruh object user
    return req.user;
  },
);
