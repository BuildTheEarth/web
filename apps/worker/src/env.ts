import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
	path: [path.resolve(process.cwd(), 'apps/worker/.env'), path.resolve(process.cwd(), '.env')],
})
