import {Outlet} from 'react-router-dom';
import './LayoutDefault.scss'
function LayoutDefault() {
    return (
        <>
            <div className='layout-default'>
                <Outlet/>
            </div>
        </>
    )
}

export default LayoutDefault;