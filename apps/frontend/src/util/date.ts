import moment from 'moment';

export function toHumanDate(date: moment.MomentInput) {
	return moment(date).format('DD.MM.YYYY');
}
export function toHumanTime(date: moment.MomentInput) {
	return moment(date).format('HH:mm:ss');
}
export function toHumanDateTime(date: moment.MomentInput) {
	return moment(date).format('DD.MM.YYYY HH:mm:ss');
}
