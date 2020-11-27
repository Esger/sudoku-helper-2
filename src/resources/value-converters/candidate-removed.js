export class CandidateRemovedValueConverter {
    toView(number) {
        return number >= 0 ? '' : 'candidate--removed';
    }
}