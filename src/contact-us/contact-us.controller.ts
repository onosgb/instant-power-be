import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ContactUsService } from './contact-us.service';
import { JwtAuthGuard } from '../shared/guards/jwt-authentication.guard';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ContactUsDto } from 'src/dto/contact-us.dto';
import { FetchAllQueryDto } from 'src/dto';

@Controller('contact-us')
export class ContactUsController {
  constructor(private contactUsService: ContactUsService) {}

  @Post()
  async contactUs(@Body() data: ContactUsDto) {
    return this.contactUsService.contactUs(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'contacts successfully feched' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async contacts(@Query() query: FetchAllQueryDto) {
    return await this.contactUsService.contacts(query);
  }
}
