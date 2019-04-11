import Link from "next/link";
import React from 'react';
import { ColumnDefinition, Head, Nav, QueryTable } from "../../components";
import { Product } from "../../types/seqdb-api/resources/Product";
import PropTypes from 'prop-types'
import { withNamespaces } from '../../i18n'

const PRODUCT_TABLE_COLUMNS: Array<ColumnDefinition<Product>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/product/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  {
    Header: "Group Name",
    accessor: "group.groupName"
  },
  {
    Header: "UPC",
    accessor: "upc"
  },
  "type",
  "description"
];

class ProductListPage extends React.Component {
  static async getInitialProps() {
    return {
      namespacesRequired: ['product']
    }
  }
  render() {
    const { t } = this.props
    return (
      <div>
        <Head title="Product Inventory" />
        <Nav />
        <div className="container-fluid">
          <h1>{t('Product Inventory')}</h1>
          <Link href="/product/edit" prefetch={true}>
            <a>{t('Add New Product')}</a>
          </Link>
          <QueryTable<Product>
            columns={PRODUCT_TABLE_COLUMNS}
            include="group"
            path="product"
          />
        </div>
      </div>
    );
  }
}

ProductListPage.propTypes = {
  t: PropTypes.func.isRequired,
}

export default withNamespaces('product')(ProductListPage)