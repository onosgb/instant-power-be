import { Injectable } from '@nestjs/common';
import { FetchAllQueryDto } from '../dto';
import { ContactUsDto } from 'src/dto/contact-us.dto';
import { MailService } from 'src/shared/services/mailer.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { ThrowBadRequest } from 'src/utils/errror_message';
@Injectable()
export class ContactUsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async contactUs(data: ContactUsDto) {
    try {
      const contactUs = await this.prisma.contactUs.create({
        data,
      });
      this.mailService.contactUs(data);
      this.mailService.contactUsAdmin(data);
      return {
        msg: 'Thank you for contacting us! \n Our support team will reach out to you shortly',
        data: contactUs,
      };
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async contacts(query: FetchAllQueryDto) {
    try {
      const prismaQuery = query.buildPrismaQuery();
      const contactUs = await this.prisma.contactUs.findMany(prismaQuery);
      return contactUs;
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }

  async getContactUsById(id: number) {
    try {
      const contactUs = await this.prisma.contactUs.findUnique({
        where: {
          id,
        },
      });
      return contactUs;
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }
  async updateContactUs(id: number, data: ContactUsDto) {
    try {
      const contactUs = await this.prisma.contactUs.update({
        where: {
          id,
        },
        data,
      });
      return contactUs;
    } catch (error) {
      return ThrowBadRequest(error);
    }
  }
}
