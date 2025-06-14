import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, res: Response): Promise<{
        success: boolean;
    }>;
    redirectToNotion(userId: string, res: Response): Response<any, Record<string, any>>;
    handleNotionCallback(code: string, state: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
